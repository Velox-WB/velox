'use client'

import { type SILData } from '../SetupWizardClient'

interface Props {
  sil: SILData
  onGoDashboard: () => void
}

export function StepComplete({ sil, onGoDashboard }: Props) {
  const business = sil.business
  const productCount = sil.portfolio?.length ?? 0
  const segmentCount = sil.segments?.length ?? 0
  const hasICP = !!(sil.icp?.decisionMakers?.length)
  const hasValue = !!(sil.valueProposition?.economic)

  const items = [
    { done: !!(business?.name),    label: 'Identidad del negocio',    icon: '◈' },
    { done: productCount > 0,      label: `${productCount} producto${productCount !== 1 ? 's' : ''} en portafolio`, icon: '◇' },
    { done: hasValue,              label: 'Propuesta de valor (4 tipos)', icon: '⬟' },
    { done: segmentCount > 0,      label: `${segmentCount} segmento${segmentCount !== 1 ? 's' : ''} de mercado`, icon: '◫' },
    { done: hasICP,                label: 'ICP con criterios de calificación', icon: '◎' },
    { done: !!(sil.commercialProcess?.monthlyGoal), label: 'Proceso comercial y umbrales', icon: '⬡' },
  ]

  const completedCount = items.filter(i => i.done).length

  return (
    <div className="max-w-xl mx-auto py-10 text-center">

      {/* Icon */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
        style={{ background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)' }}>
        ✦
      </div>

      <h1 className="font-syne text-2xl font-black text-velox-text mb-2 tracking-tight">
        Tu Agente ya te conoce
      </h1>
      <p className="text-sm text-velox-text2 leading-relaxed mb-6 max-w-sm mx-auto">
        Velox aprendió tu negocio, tu portafolio, tus clientes ideales y tu proceso comercial.
        Desde ahora, cada recomendación será específica para ti.
      </p>

      {/* SIL Summary */}
      <div className="velox-card p-4 mb-5 text-left">
        <div className="velox-section-title mb-3 text-left">Sales Intelligence Layer cargado</div>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                item.done ? 'bg-velox-green text-velox-bg' : 'border border-white/20 text-velox-text3'
              }`}>
                {item.done ? '✓' : item.icon}
              </div>
              <span className={`text-sm ${item.done ? 'text-velox-text' : 'text-velox-text3'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs text-velox-text3">{completedCount}/{items.length} secciones completadas</span>
          <div className="h-1.5 flex-1 mx-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${(completedCount/items.length)*100}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))' }} />
          </div>
          <span className="font-syne font-bold text-xs text-velox-green">
            {Math.round((completedCount/items.length)*100)}%
          </span>
        </div>
      </div>

      {/* IA preview message */}
      <div className="velox-card p-4 mb-6 text-left"
        style={{ borderColor: 'rgba(108,99,255,0.2)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)', boxShadow: '0 0 10px rgba(108,99,255,0.3)' }}>
            ✦
          </div>
          <div className="font-syne text-xs font-bold text-velox-text">Velox IA — primer análisis</div>
        </div>
        <div className="text-xs text-velox-text2 leading-relaxed p-3 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          Hola{business?.name ? `, bienvenido a ${business.name}` : ''}. Ya tengo todo el contexto de tu negocio.
          {productCount > 0 && ` Tu portafolio tiene ${productCount} producto${productCount !== 1 ? 's' : ''}.`}
          {segmentCount > 0 && ` Trabajas con ${segmentCount} segmento${segmentCount !== 1 ? 's' : ''} de mercado.`}
          {' '}Te sugiero comenzar agregando los leads que tienes hoy para que pueda darte tu primer análisis del pipeline esta semana.
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          className="velox-btn-ghost"
          onClick={() => window.history.back()}>
          ← Revisar configuración
        </button>
        <button
          className="velox-btn-primary px-8"
          onClick={onGoDashboard}>
          Ir al pipeline →
        </button>
      </div>
    </div>
  )
}
