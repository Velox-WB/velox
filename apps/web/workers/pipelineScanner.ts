/**
 * VELOX — Pipeline Scanner Worker (Fase 2)
 * 
 * Escanea el pipeline de cada organización activa cada 8 minutos.
 * Detecta situaciones de riesgo y oportunidad.
 * Genera alertas con diagnóstico y mensaje borrador via Claude.
 * 
 * Ejecutar: node --loader ts-node/esm workers/pipelineScanner.ts
 */

import { Worker, Queue, Job } from 'bullmq'
import Anthropic from '@anthropic-ai/sdk'
import { db, AlertType, AlertSeverity } from '@velox/db'

// ── Config ──────────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const SCAN_INTERVAL_MS = 8 * 60 * 1000 // 8 minutes

const connection = {
  host: new URL(REDIS_URL).hostname,
  port: Number(new URL(REDIS_URL).port) || 6379,
  password: new URL(REDIS_URL).password || undefined,
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Queue ────────────────────────────────────────────────────────────────────

export const scanQueue = new Queue('pipeline-scanner', { connection })

// Schedule recurring scan for all active orgs
export async function scheduleScan() {
  await scanQueue.add('scan-all', {}, {
    repeat: { every: SCAN_INTERVAL_MS },
    jobId: 'pipeline-scan-recurring',
  })
  console.log('✅ Pipeline scanner scheduled every 8 minutes')
}

// ── Worker ────────────────────────────────────────────────────────────────────

const worker = new Worker('pipeline-scanner', async (job: Job) => {
  console.log(`[scanner] Starting scan at ${new Date().toISOString()}`)

  const orgs = await db.organization.findMany({
    where: { setupCompleted: true },
    select: { id: true, name: true, pipelineStages: true, sil: true, monthlyGoal: true },
  })

  console.log(`[scanner] Scanning ${orgs.length} organizations`)

  for (const org of orgs) {
    try {
      await scanOrganization(org)
    } catch (err) {
      console.error(`[scanner] Error scanning org ${org.id}:`, err)
    }
  }

  console.log(`[scanner] Scan complete`)
}, { connection, concurrency: 3 })

// ── Scan Logic ────────────────────────────────────────────────────────────────

async function scanOrganization(org: {
  id: string
  name: string
  pipelineStages: unknown
  sil: unknown
  monthlyGoal: unknown
}) {
  const stages = org.pipelineStages as Array<{ id: string; maxDays: number | null }>

  // Update daysInStage for all deals
  await db.$executeRaw`
    UPDATE deals
    SET "daysInStage" = EXTRACT(DAY FROM NOW() - "stageChangedAt")::INTEGER
    WHERE "organizationId" = ${org.id}
    AND stage NOT IN ('CERRADO', 'PERDIDO')
  `

  const activeDeals = await db.deal.findMany({
    where: { organizationId: org.id, stage: { notIn: ['CERRADO', 'PERDIDO'] } },
    include: {
      contact: true,
      aiAlerts: { where: { dismissedAt: null } },
    },
  })

  const situations: Array<{
    deal: typeof activeDeals[0]
    type: AlertType
    severity: AlertSeverity
    reason: string
  }> = []

  for (const deal of activeDeals) {
    const stageConfig = stages.find(s => s.id === deal.stage.toLowerCase())
    const threshold   = stageConfig?.maxDays
    const days        = deal.daysInStage

    // Already has alert of this type — skip
    const hasInactivityAlert = deal.aiAlerts.some(a => a.type === 'INACTIVITY')
    const hasCloseAlert      = deal.aiAlerts.some(a => a.type === 'CLOSE_OPPORTUNITY')

    // 1. Inactivity over threshold
    if (threshold && days >= threshold && !hasInactivityAlert) {
      situations.push({
        deal,
        type: 'INACTIVITY',
        severity: days >= threshold * 1.5 ? 'CRITICAL' : 'WARNING',
        reason: `${days} días en etapa ${deal.stage}. Umbral: ${threshold} días.`,
      })
    }

    // 2. Ready to close — in ORDEN stage and fresh
    if (deal.stage === 'ORDEN' && days <= 3 && !hasCloseAlert) {
      situations.push({
        deal,
        type: 'CLOSE_OPPORTUNITY',
        severity: 'OPPORTUNITY',
        reason: `Deal en Orden de Compra con ${days} días. Listo para firma.`,
      })
    }

    // 3. High probability forecast deal going stale
    if (deal.stage === 'FORECAST' && Number(deal.probabilityAi) >= 0.6 &&
        days >= 5 && !deal.aiAlerts.some(a => a.type === 'NO_NEXT_STEP')) {
      situations.push({
        deal,
        type: 'NO_NEXT_STEP',
        severity: 'WARNING',
        reason: `Deal de alto valor en Forecast lleva ${days} días sin avance.`,
      })
    }
  }

  // Generate alerts for detected situations
  for (const situation of situations) {
    await generateAlert(org, situation)
  }

  console.log(`[scanner] ${org.name}: ${situations.length} alerts generated`)
}

async function generateAlert(
  org: { id: string; name: string; sil: unknown; monthlyGoal: unknown },
  situation: {
    deal: {
      id: string; name: string; stage: string; value: unknown; daysInStage: number
      source: string; contact: { name: string; company: string | null; role: string | null }
    }
    type: AlertType
    severity: AlertSeverity
    reason: string
  }
) {
  const { deal, type, severity, reason } = situation
  const sil = org.sil as Record<string, unknown> | null

  const prompt = `Eres Velox IA. Analiza esta situación de ventas y genera una alerta accionable.

EMPRESA: ${org.name}
DEAL: ${deal.name}
CONTACTO: ${deal.contact.name} (${deal.contact.company ?? ''}) — ${deal.contact.role ?? ''}
VALOR: $${Number(deal.value).toLocaleString()}
ETAPA: ${deal.stage}
DÍAS SIN AVANCE: ${deal.daysInStage}
CANAL: ${deal.source}
SITUACIÓN: ${reason}
PORTAFOLIO: ${sil?.portfolio ? JSON.stringify(sil.portfolio) : 'No disponible'}
PROPUESTA DE VALOR: ${sil?.valueProposition ? JSON.stringify(sil.valueProposition) : 'No disponible'}

Responde SOLO en JSON con esta estructura exacta:
{
  "title": "Título corto de la alerta (máx 60 chars)",
  "summary": "Resumen de una línea (máx 120 chars)",
  "diagnosis": "Análisis detallado de 2-3 oraciones explicando el riesgo o oportunidad y su contexto",
  "actions": [
    {"order": 1, "title": "Acción concreta", "description": "Detalle de por qué y cómo ejecutarla"},
    {"order": 2, "title": "Acción concreta", "description": "Detalle"},
    {"order": 3, "title": "Acción concreta", "description": "Detalle"}
  ],
  "draftMessage": "Mensaje listo para enviar al contacto por el canal de origen. Personalizado con su nombre y contexto específico del deal."
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : null
    if (!content) return

    const clean = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)

    await db.aiAlert.create({
      data: {
        organizationId: org.id,
        dealId: deal.id,
        type,
        severity,
        title:        parsed.title,
        summary:      parsed.summary,
        diagnosis:    parsed.diagnosis,
        actions:      parsed.actions,
        draftMessage: parsed.draftMessage,
        scanMetadata: { daysInStage: deal.daysInStage, reason, stage: deal.stage },
      },
    })

    // Create notification for deal owner
    const dealFull = await db.deal.findUnique({
      where: { id: deal.id },
      select: { assignedToId: true },
    })

    if (dealFull?.assignedToId) {
      await db.notification.create({
        data: {
          organizationId: org.id,
          userId: dealFull.assignedToId,
          type: 'ai_alert',
          title: parsed.title,
          body:  parsed.summary,
          link:  `/dashboard/deals/${deal.id}`,
          payload: { alertType: type, severity, dealId: deal.id },
        },
      })
    }

  } catch (err) {
    console.error(`[scanner] Failed to generate alert for deal ${deal.id}:`, err)
  }
}

// ── Error handling ────────────────────────────────────────────────────────────

worker.on('completed', job => console.log(`[scanner] Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`[scanner] Job ${job?.id} failed:`, err))

// ── Bootstrap ─────────────────────────────────────────────────────────────────

scheduleScan().then(() => console.log('🚀 Velox Pipeline Scanner started'))
