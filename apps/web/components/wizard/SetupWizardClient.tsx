'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StepBusiness }   from './steps/StepBusiness'
import { StepPortfolio }  from './steps/StepPortfolio'
import { StepValue }      from './steps/StepValue'
import { StepSegments }   from './steps/StepSegments'
import { StepICP }        from './steps/StepICP'
import { StepProcess }    from './steps/StepProcess'
import { StepComplete }   from './steps/StepComplete'

// ── Types ──────────────────────────────────────────────────────────────────

export type SILData = {
  business?: {
    name?: string
    sector?: string
    description?: string
    yearsInMarket?: number
    teamSize?: string
    differentiators?: string
    competitors?: string[]
  }
  portfolio?: Array<{
    id: string
    name: string
    category: string
    price: number
    type: 'flagship' | 'upsell' | 'addon' | 'entry'
  }>
  pains?: string[]
  painCost?: string
  valueProposition?: {
    economic?: string
    functional?: string
    emotional?: string
    social?: string
    timeToValue?: string
  }
  segments?: Array<{
    id: string
    name: string
    size?: string
    revenue?: string
    industries?: string[]
    mainPain?: string
    recommendedProduct?: string
  }>
  icp?: {
    decisionMakers?: string[]
    regions?: string[]
    businessModels?: string[]
    positiveSignals?: string[]
    negativeSignals?: string[]
    scoring?: {
      companySize?: number
      decisionMakerRole?: number
      painUrgency?: number
      budget?: number
    }
  }
  commercialProcess?: {
    avgCycle?: number
    avgTicket?: number
    monthlyGoal?: number
    thresholds?: {
      prospecto?: number
      lead?: number
      oportunidad?: number
      propuesta?: number
      forecast?: number
      orden?: number
    }
  }
}

const STEPS = [
  { id: 'business',  label: 'Mi negocio',          sub: 'Identidad' },
  { id: 'portfolio', label: 'Portafolio',           sub: 'Productos y precios' },
  { id: 'value',     label: 'Propuesta de valor',   sub: 'Beneficios' },
  { id: 'segments',  label: 'Segmentos',            sub: 'Mercados objetivo' },
  { id: 'icp',       label: 'ICP',                  sub: 'Cliente ideal' },
  { id: 'process',   label: 'Proceso comercial',    sub: 'Pipeline y etapas' },
  { id: 'complete',  label: 'Activar IA',           sub: 'Listo para vender' },
]

const TIPS: Record<string, { label: string; text: string }> = {
  business:  { label: 'Para el Agente IA', text: 'La descripción de tu negocio es el contexto base del Agente en cada conversación. Sé específico — "servimos clínicas privadas en Centroamérica" es mucho más útil que "somos una empresa de servicios".' },
  portfolio: { label: 'Para el Agente IA', text: 'Con el portafolio cargado, el Agente puede recomendar la solución correcta según el perfil del prospecto, sin que el vendedor tenga que saberlo de memoria.' },
  value:     { label: 'Impacto en ventas', text: 'Los compradores B2B responden a distintos tipos de beneficio. El Agente elegirá el argumento correcto: económico con el CFO, funcional con el gerente operativo, emocional con el equipo.' },
  segments:  { label: 'Para el Agente IA', text: 'Al definir segmentos, el Agente adapta el mensaje automáticamente. Un mismo producto se presenta distinto a una clínica que a una distribuidora.' },
  icp:       { label: 'Calificación automática', text: 'Con el ICP definido, el Agente calificará cada prospecto nuevo y le dirá al vendedor si vale la pena invertir tiempo, antes de la primera llamada.' },
  process:   { label: 'Alertas inteligentes', text: 'Los tiempos por etapa permiten al Agente detectar cuándo un deal está tomando más de lo normal y alertar al vendedor antes de que se enfríe.' },
  complete:  { label: 'Setup completo', text: 'Tu Agente ya tiene todo el contexto para ser tu mejor vendedor. Desde ahora, cada recomendación será específica para tu negocio.' },
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  orgId: string
  initialStep: number
  initialSil: Record<string, unknown> | null
}

// ── Component ──────────────────────────────────────────────────────────────

export function SetupWizardClient({ orgId, initialStep, initialSil }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(Array.from({ length: initialStep }, (_, i) => i))
  )
  const [sil, setSil] = useState<SILData>((initialSil as SILData) ?? {})
  const [saving, setSaving] = useState(false)

  const stepKey = STEPS[currentStep]?.id ?? 'business'
  const tip = TIPS[stepKey]
  const progress = Math.round((currentStep / 6) * 100)

  // ── Save handler ──────────────────────────────────────────────────────────

  const saveStep = useCallback(async (stepData: Partial<SILData>, nextStep: number) => {
    setSaving(true)
    const newSil = { ...sil, ...stepData }
    setSil(newSil)

    try {
      await fetch('/api/setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          step: nextStep,
          sil: newSil,
          completed: nextStep >= 6,
        }),
      })
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]))
    setCurrentStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [sil, orgId, currentStep])

  const goBack = () => setCurrentStep(s => Math.max(0, s - 1))

  const goToDashboard = () => router.push('/dashboard')

  // ── Render ────────────────────────────────────────────────────────────────

  const stepProps = { sil, onNext: saveStep, onBack: goBack, saving }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="h-14 border-b flex items-center px-8 gap-4 flex-shrink-0"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mr-8">
          <div className="w-2 h-2 rounded-full bg-velox-accent shadow-[0_0_8px_rgba(108,99,255,0.5)]" />
          <span className="font-syne font-black text-lg tracking-tight">Velox</span>
        </div>
        <span className="font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-velox-text3 flex-1">
          Configuración inicial · Sales Intelligence Layer
        </span>
        <div className="flex items-center gap-2 text-xs text-velox-text3">
          <div className="w-1.5 h-1.5 rounded-full bg-velox-green" />
          {saving ? 'Guardando...' : 'Guardado automáticamente'}
        </div>
      </header>

      {/* Step tabs */}
      <div className="border-b flex overflow-x-auto flex-shrink-0"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        {STEPS.map((step, i) => {
          const isDone = completedSteps.has(i)
          const isActive = i === currentStep
          return (
            <button key={step.id}
              onClick={() => (isDone || isActive) && setCurrentStep(i)}
              className="flex items-center gap-2.5 px-4 py-3 border-b-2 text-left transition-all whitespace-nowrap flex-shrink-0"
              style={{
                borderBottomColor: isActive ? 'var(--accent)' : isDone ? 'var(--green)' : 'transparent',
                cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
                background: isActive ? 'rgba(108,99,255,0.06)' : 'transparent',
              }}>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                font-syne text-[10px] font-bold transition-all ${
                isActive ? 'bg-velox-accent border-velox-accent text-white shadow-[0_0_8px_rgba(108,99,255,0.4)]' :
                isDone   ? 'bg-velox-green border-velox-green text-white' :
                           'border-white/20 text-velox-text3'
              }`}>
                {isDone && !isActive ? '✓' : i + 1}
              </div>
              <div>
                <div className={`text-xs font-medium ${isActive ? 'text-velox-text' : isDone ? 'text-velox-green' : 'text-velox-text3'}`}>
                  {step.label}
                </div>
                <div className="text-[10px] text-velox-text3">{step.sub}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">

          {currentStep === 0 && <StepBusiness {...stepProps} />}
          {currentStep === 1 && <StepPortfolio {...stepProps} />}
          {currentStep === 2 && <StepValue {...stepProps} />}
          {currentStep === 3 && <StepSegments {...stepProps} />}
          {currentStep === 4 && <StepICP {...stepProps} />}
          {currentStep === 5 && <StepProcess {...stepProps} />}
          {currentStep === 6 && <StepComplete sil={sil} onGoDashboard={goToDashboard} />}

        </main>

        {/* Sidebar */}
        <aside className="w-64 border-l flex flex-col gap-4 p-5 overflow-y-auto"
          style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>

          {/* Progress */}
          <div>
            <div className="velox-section-title">Progreso del setup</div>
            <div className="velox-card p-3">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-velox-text2">Sales Intelligence Layer</span>
                <span className="font-syne font-bold text-velox-accent2">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))' }} />
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 text-velox-text3">
                <span>Paso {Math.min(currentStep + 1, 6)} de 6</span>
                <span className="text-velox-green">{completedSteps.size} completados</span>
              </div>
            </div>
          </div>

          {/* Tip */}
          {tip && (
            <div>
              <div className="velox-section-title">Por qué importa</div>
              <div className="velox-card p-3 border-l-2 border-l-velox-accent">
                <div className="text-[9px] font-syne font-bold uppercase tracking-wider text-velox-accent mb-1.5">
                  {tip.label}
                </div>
                <p className="text-[11px] text-velox-text2 leading-relaxed">{tip.text}</p>
              </div>
            </div>
          )}

          {/* Auto-save note */}
          <div className="velox-card p-3 border-l-2 border-l-velox-green">
            <div className="text-[9px] font-syne font-bold uppercase tracking-wider text-velox-green mb-1.5">
              Guardado automático
            </div>
            <p className="text-[11px] text-velox-text2 leading-relaxed">
              Puedes cerrar y continuar donde quedaste en cualquier momento.
            </p>
          </div>

          <div className="velox-card p-3 border-l-2 border-l-velox-amber">
            <div className="text-[9px] font-syne font-bold uppercase tracking-wider text-velox-amber mb-1.5">
              Siempre editable
            </div>
            <p className="text-[11px] text-velox-text2 leading-relaxed">
              Tu portafolio, ICP y segmentos pueden actualizarse desde Configuración. El Agente se adapta automáticamente.
            </p>
          </div>

        </aside>
      </div>
    </div>
  )
}
