import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@velox/db'
import { z } from 'zod'

const SaveSchema = z.object({
  orgId:     z.string(),
  step:      z.number().min(0).max(6),
  sil:       z.record(z.unknown()),
  completed: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { orgId, step, sil, completed } = SaveSchema.parse(body)

    // Verify user is member of this org
    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    })
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Save progress
    const org = await db.organization.update({
      where: { id: orgId },
      data: {
        setupStep: step,
        setupCompleted: completed ?? (step >= 6),
        sil,
        // Update monthly goal if available
        ...(sil.commercialProcess && typeof sil.commercialProcess === 'object' &&
          'monthlyGoal' in sil.commercialProcess &&
          sil.commercialProcess.monthlyGoal
          ? { monthlyGoal: Number(sil.commercialProcess.monthlyGoal) }
          : {}),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'setup_step_save',
        after: { step, completed: org.setupCompleted },
      },
    })

    return NextResponse.json({ ok: true, step: org.setupStep, completed: org.setupCompleted })
  } catch (err) {
    console.error('[setup/save]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
