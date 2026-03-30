'use client'

import { useState } from 'react'
import { type StepProps, PageHeader, FormGroup, Textarea, NavButtons } from './shared'

const VALUE_TYPES = [
  {
    key: 'economic' as const,
    icon: '$',
    title: 'Beneficios económicos',
    sub: 'ROI, ahorro, ingreso adicional',
    placeholder: 'Ej. Reducción del 40% en tiempo administrativo. ROI promedio de 4x en 6 meses. Incremento del 25% en tasa de cierre...',
    color: 'var(--green)',
    bg: 'rgba(34,211,160,0.08)',
    border: 'rgba(34,211,160,0.2)',
  },
  {
    key: 'functional' as const,
    icon: '⬟',
    title: 'Beneficios funcionales',
    sub: 'Lo que el cliente puede hacer mejor',
    placeholder: 'Ej. Seguimiento automatizado de prospectos. Pipeline visible en tiempo real. Cotizaciones en minutos en lugar de días...',
    color: 'var(--accent2)',
    bg: 'rgba(108,99,255,0.08)',
    border: 'rgba(108,99,255,0.2)',
  },
  {
    key: 'emotional' as const,
    icon: '◉',
    title: 'Beneficios emocionales',
    sub: 'Cómo se siente el cliente',
    placeholder: 'Ej. El CEO duerme tranquilo sabiendo el estado real del pipeline. El vendedor llega a la reunión preparado y seguro...',
    color: 'var(--amber)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    key: 'social' as const,
    icon: '◑',
    title: 'Beneficios sociales',
    sub: 'Cómo los perciben otros',
    placeholder: 'Ej. La empresa se percibe como más profesional y ordenada. El equipo proyecta control frente a sus propios clientes...',
    color: 'var(--blue)',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.2)',
  },
]

export function StepValue({ sil, onNext, onBack, saving }: StepProps) {
  const vp = sil.valueProposition ?? {}
  const [values, setValues] = useState({
    economic:    vp.economic   ?? '',
    functional:  vp.functional ?? '',
    emotional:   vp.emotional  ?? '',
    social:      vp.social     ?? '',
    timeToValue: vp.timeToValue ?? '',
  })

  const update = (key: keyof typeof values, val: string) =>
    setValues(v => ({ ...v, [key]: val }))

  const handleNext = () => onNext({ valueProposition: values }, 3)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 3 de 6"
        title="Tu propuesta de valor"
        desc="El Agente usará esto para articular los beneficios correctos según el perfil de cada cliente. Los compradores B2B responden a los cuatro tipos."
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        {VALUE_TYPES.map(t => (
          <div key={t.key} className="rounded-xl overflow-hidden border"
            style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
                {t.icon}
              </div>
              <div>
                <div className="font-syne text-[12px] font-bold text-velox-text">{t.title}</div>
                <div className="text-[10px] text-velox-text3">{t.sub}</div>
              </div>
            </div>
            <div className="p-4">
              <Textarea value={values[t.key]} onChange={v => update(t.key, v)}
                placeholder={t.placeholder} rows={4} />
            </div>
          </div>
        ))}
      </div>

      <div className="velox-card p-5">
        <FormGroup label="Tiempo promedio para que el cliente vea resultados">
          <input type="text" className="velox-input"
            value={values.timeToValue}
            onChange={e => update('timeToValue', e.target.value)}
            placeholder="Ej. 90 días para ver los primeros resultados medibles" />
        </FormGroup>
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Continuar → Segmentos"
        saving={saving} step={2} />
    </div>
  )
}
