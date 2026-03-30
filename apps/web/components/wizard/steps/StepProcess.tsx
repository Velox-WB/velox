'use client'

import { useState } from 'react'
import { type StepProps, PageHeader, Section, FormRow, FormGroup, NavButtons } from './shared'

const STAGES = [
  { id: 'prospecto',   label: 'Prospecto',       color: '#5a5a72', default: 3 },
  { id: 'lead',        label: 'Lead',             color: '#60a5fa', default: 5 },
  { id: 'oportunidad', label: 'Oportunidad',      color: '#818cf8', default: 7 },
  { id: 'propuesta',   label: 'Propuesta',        color: '#a78bfa', default: 10 },
  { id: 'forecast',    label: 'Forecast',         color: '#f59e0b', default: 7 },
  { id: 'orden',       label: 'Orden de Compra',  color: '#22d3a0', default: 5 },
]

export function StepProcess({ sil, onNext, onBack, saving }: StepProps) {
  const cp = sil.commercialProcess ?? {}
  const th = cp.thresholds ?? {}

  const [thresholds, setThresholds] = useState<Record<string, number>>(
    Object.fromEntries(STAGES.map(s => [s.id, (th as Record<string, number>)[s.id] ?? s.default]))
  )
  const [avgCycle,   setAvgCycle]  = useState(String(cp.avgCycle   ?? ''))
  const [avgTicket,  setAvgTicket] = useState(String(cp.avgTicket  ?? ''))
  const [monthlyGoal,setGoal]      = useState(String(cp.monthlyGoal ?? ''))

  const updateThreshold = (id: string, v: number) =>
    setThresholds(t => ({ ...t, [id]: v }))

  const handleNext = () => onNext({
    commercialProcess: {
      avgCycle:    avgCycle    ? Number(avgCycle)    : undefined,
      avgTicket:   avgTicket   ? Number(avgTicket)   : undefined,
      monthlyGoal: monthlyGoal ? Number(monthlyGoal) : undefined,
      thresholds,
    }
  }, 6)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 6 de 6"
        title="Tu proceso comercial"
        desc="Las 8 etapas B2B ya están configuradas. Define los tiempos máximos por etapa para que el Agente sepa cuándo un deal está en riesgo."
      />

      <Section icon="⬡" title="Tiempos máximos por etapa"
        sub="El Agente alertará cuando un deal supere estos días sin actividad">
        <div className="flex flex-col gap-2">
          {STAGES.map(s => {
            const val = thresholds[s.id]
            const pct = Math.min(100, (val / 14) * 100)
            return (
              <div key={s.id} className="rounded-lg px-3 py-2.5 flex items-center gap-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div className="text-sm font-medium text-velox-text2 w-36 flex-shrink-0">{s.label}</div>
                <input type="range" min={1} max={21} value={val}
                  onChange={e => updateThreshold(s.id, Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, ${s.color} ${pct}%, var(--surface2) ${pct}%)`, accentColor: s.color }} />
                <div className="font-syne text-xs font-bold w-14 text-right flex-shrink-0"
                  style={{ color: s.color }}>
                  {val}d máx.
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 p-3 rounded-lg text-[11px] text-velox-text2 leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          ⚡ El motor de alertas (Fase 2) usa estos umbrales para detectar deals en riesgo automáticamente
          y generar el diagnóstico con el borrador de mensaje para retomar.
        </div>
      </Section>

      <Section icon="◉" title="Métricas de tu negocio"
        sub="Para que el Agente contextualice el forecast y las predicciones">
        <FormRow cols={3}>
          <FormGroup label="Meta mensual de ventas">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-velox-text3 text-xs">$</span>
              <input type="number" className="velox-input pl-6"
                value={monthlyGoal} onChange={e => setGoal(e.target.value)}
                placeholder="Ej. 60000" />
            </div>
          </FormGroup>
          <FormGroup label="Ticket promedio">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-velox-text3 text-xs">$</span>
              <input type="number" className="velox-input pl-6"
                value={avgTicket} onChange={e => setAvgTicket(e.target.value)}
                placeholder="Ej. 15000" />
            </div>
          </FormGroup>
          <FormGroup label="Ciclo de venta promedio (días)">
            <input type="number" className="velox-input"
              value={avgCycle} onChange={e => setAvgCycle(e.target.value)}
              placeholder="Ej. 18" />
          </FormGroup>
        </FormRow>
      </Section>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="✦ Activar mi Agente IA →"
        saving={saving} step={5} />
    </div>
  )
}
