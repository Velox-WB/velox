import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@velox/db'
import superjson from 'superjson'
import { z } from 'zod'

// ── Context ────────────────────────────────────────────────────────────────

export async function createTRPCContext() {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) return { user: null, org: null, db }

  const [user, org] = await Promise.all([
    db.user.findUnique({ where: { clerkId: userId } }),
    db.organization.findUnique({ where: { clerkId: orgId } }),
  ])

  return { user, org, db }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

// ── tRPC Init ──────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({ transformer: superjson })

export const router    = t.router
export const procedure = t.procedure

// Auth middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.org) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { user: ctx.user, org: ctx.org, db: ctx.db } })
})

export const protectedProcedure = t.procedure.use(isAuthed)

// ── Routers ────────────────────────────────────────────────────────────────

const dealsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.deal.findMany({
      where: { organizationId: ctx.org.id },
      include: { contact: true, assignedTo: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { lastActivityAt: 'desc' },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.id, organizationId: ctx.org.id },
        include: {
          contact: true,
          activities: { orderBy: { createdAt: 'desc' }, take: 20 },
          quotes: { orderBy: { createdAt: 'desc' }, take: 5 },
          aiAlerts: { where: { dismissedAt: null }, orderBy: { createdAt: 'desc' } },
        },
      })
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' })
      return deal
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      contactId: z.string(),
      value: z.number().min(0),
      stage: z.enum(['PROSPECTO','LEAD','OPORTUNIDAD','PROPUESTA','FORECAST','ORDEN','CERRADO','PERDIDO']).default('PROSPECTO'),
      source: z.enum(['WHATSAPP','EMAIL','REFERIDO','WEB','INSTAGRAM','FACEBOOK','LLAMADA','LINKEDIN','OTRO','OTHER']).default('OTHER'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get probability from pipeline stages config
      const stages = ctx.org.pipelineStages as Array<{ id: string; probability: number }>
      const stageConfig = stages.find(s => s.id === input.stage.toLowerCase())
      const prob = stageConfig?.probability ?? 0

      const deal = await ctx.db.deal.create({
        data: {
          organizationId: ctx.org.id,
          assignedToId: ctx.user.id,
          ...input,
          probabilityManual: prob,
          weightedValue: (input.value * prob) / 100,
        } as any,
        include: { contact: true },
      })

      await ctx.db.activity.create({
        data: {
          organizationId: ctx.org.id,
          dealId: deal.id,
          userId: ctx.user.id,
          type: 'NOTE',
          title: 'Deal creado',
          notes: `Deal "${input.name}" creado en etapa ${input.stage}`,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          organizationId: ctx.org.id,
          userId: ctx.user.id,
          entityType: 'deal',
          entityId: deal.id,
          action: 'create',
          after: input,
        },
      })

      return deal
    }),

  updateStage: protectedProcedure
    .input(z.object({
      id: z.string(),
      stage: z.enum(['PROSPECTO','LEAD','OPORTUNIDAD','PROPUESTA','FORECAST','ORDEN','CERRADO','PERDIDO']),
      lostReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.deal.findFirst({
        where: { id: input.id, organizationId: ctx.org.id },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

      const stages = ctx.org.pipelineStages as Array<{ id: string; probability: number }>
      const stageConfig = stages.find(s => s.id === input.stage.toLowerCase())
      const prob = stageConfig?.probability ?? existing.probabilityManual

      const deal = await ctx.db.deal.update({
        where: { id: input.id },
        data: {
          stage: input.stage,
          probabilityManual: prob,
          weightedValue: (Number(existing.value) * prob) / 100,
          daysInStage: 0,
          stageChangedAt: new Date(),
          lastActivityAt: new Date(),
          ...(input.stage === 'CERRADO' ? { closedAt: new Date() } : {}),
          ...(input.stage === 'PERDIDO' ? { lostAt: new Date(), lostReason: input.lostReason } : {}),
        },
      })

      await ctx.db.activity.create({
        data: {
          organizationId: ctx.org.id,
          dealId: input.id,
          userId: ctx.user.id,
          type: 'STAGE_CHANGE',
          title: `Etapa cambiada a ${input.stage}`,
          notes: `De ${existing.stage} → ${input.stage}`,
          completedAt: new Date(),
        },
      })

      return deal
    }),
})

const contactsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      where: { organizationId: ctx.org.id },
      orderBy: { icpScore: 'desc' },
    })
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().optional(),
      role: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      source: z.enum(['WHATSAPP','EMAIL','REFERIDO','WEB','INSTAGRAM','FACEBOOK','LLAMADA','LINKEDIN','OTRO','OTHER']).default('OTHER'),
      referrerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Calculate ICP score based on org's ICP config
      const sil = ctx.org.sil as Record<string, unknown> | null
      const icpConfig = sil?.icp as { decisionMakers?: string[]; scoring?: Record<string, number> } | undefined
      let icpScore = 50 // base score

      if (icpConfig?.decisionMakers && input.role) {
        const roleMatch = icpConfig.decisionMakers.some(dm =>
          input.role!.toLowerCase().includes(dm.toLowerCase())
        )
        if (roleMatch) icpScore += 20
      }

      if (input.source === 'REFERIDO') icpScore += 15

      return ctx.db.contact.create({data: { organizationId: ctx.org.id, ...input, icpScore: Math.min(100, icpScore) } as any,
      })
    }),
})

const quotesRouter = router({
  list: protectedProcedure
    .input(z.object({ dealId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.quote.findMany({
        where: { organizationId: ctx.org.id, ...(input.dealId ? { dealId: input.dealId } : {}) },
        orderBy: { createdAt: 'desc' },
      })
    }),
})

const alertsRouter = router({
  list: protectedProcedure
    .input(z.object({ dismissed: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.aiAlert.findMany({
        where: {
          organizationId: ctx.org.id,
          ...(input.dismissed === false ? { dismissedAt: null } : {}),
        },
        include: { deal: { include: { contact: true } } },
        orderBy: { createdAt: 'desc' },
      })
    }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.aiAlert.update({
        where: { id: input.id },
        data: { dismissedAt: new Date() },
      })
    }),

  markActioned: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.aiAlert.update({
        where: { id: input.id },
        data: { actionedAt: new Date() },
      })
    }),
})

const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.org.id

    const [deals, closedThisMonth, alerts] = await Promise.all([
      ctx.db.deal.findMany({
        where: { organizationId: orgId, stage: { notIn: ['CERRADO', 'PERDIDO'] } },
        select: { value: true, weightedValue: true, probabilityAi: true, stage: true },
      }),
      ctx.db.deal.findMany({
        where: {
          organizationId: orgId,
          stage: 'CERRADO',
          closedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        select: { value: true },
      }),
      ctx.db.aiAlert.count({
        where: { organizationId: orgId, dismissedAt: null },
      }),
    ])

    const pipeline   = deals.reduce((sum, d) => sum + Number(d.value), 0)
    const weighted   = deals.reduce((sum, d) => sum + Number(d.weightedValue), 0)
    const closed     = closedThisMonth.reduce((sum, d) => sum + Number(d.value), 0)
    const goal       = Number(ctx.org.monthlyGoal)
    const progress   = goal > 0 ? Math.round((closed / goal) * 100) : 0

    return { pipeline, weighted, closed, goal, progress, activeAlerts: alerts, dealCount: deals.length }
  }),
})

// ── Root Router ────────────────────────────────────────────────────────────

export const appRouter = router({
  deals:     dealsRouter,
  contacts:  contactsRouter,
  quotes:    quotesRouter,
  alerts:    alertsRouter,
  dashboard: dashboardRouter,
})

export type AppRouter = typeof appRouter
