import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@velox/db'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, dealId, conversationId } = await req.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Load org and user
    const [org, user] = await Promise.all([
      db.organization.findUnique({ where: { clerkId: orgId } }),
      db.user.findUnique({ where: { clerkId: userId } }),
    ])
    if (!org || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Load pipeline snapshot
    const [deals, closedMonth] = await Promise.all([
      db.deal.findMany({
        where: { organizationId: org.id, stage: { notIn: ['CERRADO', 'PERDIDO'] } },
        include: { contact: true },
        orderBy: { lastActivityAt: 'asc' },
        take: 20,
      }),
      db.deal.findMany({
        where: {
          organizationId: org.id, stage: 'CERRADO',
          closedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        select: { value: true },
      }),
    ])

    // Load active deal context if provided
    let activeDeal = null
    if (dealId) {
      activeDeal = await db.deal.findFirst({
        where: { id: dealId, organizationId: org.id },
        include: {
          contact: true,
          activities: { orderBy: { createdAt: 'desc' }, take: 10 },
          quotes: { orderBy: { createdAt: 'desc' }, take: 3 },
          aiAlerts: { where: { dismissedAt: null } },
        },
      })
    }

    // Load conversation history
    let conversation = conversationId
      ? await db.aiConversation.findFirst({ where: { id: conversationId, organizationId: org.id } })
      : null

    const messages = (conversation?.messages as Array<{ role: string; content: string }>) ?? []

    // ── Assemble dynamic context ───────────────────────────────────────────
    const sil = org.sil as Record<string, unknown> | null
    const pipeline_total = deals.reduce((s, d) => s + Number(d.value), 0)
    const closed_month   = closedMonth.reduce((s, d) => s + Number(d.value), 0)
    const goal           = Number(org.monthlyGoal)

    const systemPrompt = `Eres Velox IA, el Agente de ventas inteligente de ${org.name}.
Hablas en español. Eres directo, específico y accionable. Nunca das respuestas genéricas.
Cada recomendación debe mencionar nombres de deals, montos y acciones concretas.

═══ IDENTIDAD DEL NEGOCIO ═══
Empresa: ${org.name}
${sil?.business ? `Descripción: ${(sil.business as Record<string,string>).description ?? ''}
Sector: ${(sil.business as Record<string,string>).sector ?? ''}
Diferenciadores: ${(sil.business as Record<string,string>).differentiators ?? ''}` : ''}

═══ PORTAFOLIO ═══
${sil?.portfolio ? (sil.portfolio as Array<{name:string;price:number;type:string}>).map(p => `• ${p.name}: $${p.price.toLocaleString()} (${p.type})`).join('\n') : 'No configurado aún.'}

═══ PROPUESTA DE VALOR ═══
${sil?.valueProposition ? `Económico: ${(sil.valueProposition as Record<string,string>).economic ?? ''}
Funcional: ${(sil.valueProposition as Record<string,string>).functional ?? ''}
Emocional: ${(sil.valueProposition as Record<string,string>).emotional ?? ''}
Social: ${(sil.valueProposition as Record<string,string>).social ?? ''}` : 'No configurado aún.'}

═══ CLIENTE IDEAL (ICP) ═══
${sil?.icp ? `Decisores: ${((sil.icp as Record<string,unknown>).decisionMakers as string[] ?? []).join(', ')}
Señales positivas: ${((sil.icp as Record<string,unknown>).positiveSignals as string[] ?? []).join('; ')}
Señales negativas: ${((sil.icp as Record<string,unknown>).negativeSignals as string[] ?? []).join('; ')}` : 'No configurado aún.'}

═══ ESTADO DEL PIPELINE ═══
Total activo: $${pipeline_total.toLocaleString()}
Cerrado este mes: $${closed_month.toLocaleString()} / Meta: $${goal.toLocaleString()} (${goal > 0 ? Math.round((closed_month/goal)*100) : 0}%)
Deals activos: ${deals.length}

DEALS ACTIVOS (ordenados por urgencia):
${deals.map(d => {
  const days = d.daysInStage
  const stages = org.pipelineStages as Array<{id:string;maxDays:number|null}>
  const stageConfig = stages.find(s => s.id === d.stage.toLowerCase())
  const threshold = stageConfig?.maxDays
  const overdue = threshold && days >= threshold
  return `• ${d.name} (${d.contact.company ?? d.contact.name}): $${Number(d.value).toLocaleString()} | ${d.stage} | ${days}d en etapa${overdue ? ' ⚠️ SOBRE UMBRAL' : ''} | Canal: ${d.source}`
}).join('\n')}

${activeDeal ? `
═══ DEAL ACTIVO EN CONTEXTO ═══
Nombre: ${activeDeal.name}
Contacto: ${activeDeal.contact.name} (${activeDeal.contact.company ?? ''}) — ${activeDeal.contact.role ?? ''}
Valor: $${Number(activeDeal.value).toLocaleString()}
Etapa: ${activeDeal.stage} (${activeDeal.daysInStage} días)
Canal: ${activeDeal.source}
ICP Score: ${activeDeal.contact.icpScore}/100
Última actividad: ${activeDeal.activities[0]?.title ?? 'Sin actividad registrada'}
Alertas activas: ${activeDeal.aiAlerts.length > 0 ? activeDeal.aiAlerts.map(a => a.title).join('; ') : 'Ninguna'}
` : ''}

═══ INSTRUCCIONES DE RESPUESTA ═══
- Siempre menciona nombres de deals, contactos y montos específicos
- Da máximo 3 acciones concretas y priorizadas
- Cuando hay riesgo, genera un borrador de mensaje listo para enviar
- Usa el portafolio para sugerir soluciones específicas según el ICP del prospecto
- Formato: párrafo corto de diagnóstico + lista de acciones + mensaje si aplica
- Máximo 300 palabras`

    // Add user message to history
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
    ]

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: updatedMessages
        .slice(-10) // last 10 for context
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Lo siento, hubo un error procesando tu consulta.'

    const finalMessages = [
      ...updatedMessages,
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ]

    // Save conversation
    if (conversation) {
      conversation = await db.aiConversation.update({
        where: { id: conversation.id },
        data: {
          messages: finalMessages,
          tokensInput:  (conversation.tokensInput  + response.usage.input_tokens),
          tokensOutput: (conversation.tokensOutput + response.usage.output_tokens),
        },
      })
    } else {
      conversation = await db.aiConversation.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          dealId: dealId ?? null,
          messages: finalMessages,
          contextSnapshot: { pipeline_total, closed_month, deal_count: deals.length },
          tokensInput:  response.usage.input_tokens,
          tokensOutput: response.usage.output_tokens,
        },
      })
    }

    return NextResponse.json({
      message:        assistantMessage,
      conversationId: conversation.id,
      tokensUsed:     response.usage.input_tokens + response.usage.output_tokens,
    })

  } catch (err) {
    console.error('[ai/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
