'use client'

import { useState } from 'react'
import { type StepProps, PageHeader, Section, FormRow, FormGroup, Textarea, TagInput, Slider, NavButtons } from './shared'

export function StepICP({ sil, onNext, onBack, saving }: StepProps) {
  const icp = sil.icp ?? {}

  const [decisionMakers, setDM]   = useState<string[]>(icp.decisionMakers ?? [])
  const [regions, setRegions]     = useState<string[]>(icp.regions ?? [])
  const [bizModels, setBiz]       = useState<string[]>(icp.businessModels ?? [])
  const [posSignals, setPos]      = useState<string[]>(icp.positiveSignals ?? [])
  const [negSignals, setNeg]      = useState<string[]>(icp.negativeSignals ?? [])
  const [scoring, setScoring]     = useState({
    companySize:       icp.scoring?.companySize       ?? 7,
    decisionMakerRole: icp.scoring?.decisionMakerRole ?? 9,
    painUrgency:       icp.scoring?.painUrgency       ?? 8,
    budget:            icp.scoring?.budget            ?? 6,
  })

  const updateScore = (key: keyof typeof scoring, v: number) =>
    setScoring(s => ({ ...s, [key]: v }))

  const handleNext = () => onNext({
    icp: {
      decisionMakers, regions, businessModels: bizModels,
      positiveSignals: posSignals, negativeSignals: negSignals,
      scoring,
    }
  }, 5)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 5 de 6"
        title="Tu cliente ideal (ICP)"
        desc="El Agente usará este perfil para calificar automáticamente cada nuevo prospecto y decirle al vendedor qué tan prioritario es y por qué."
      />

      <Section icon="◎" title="Señales de un cliente ideal"
        sub="Características del cliente que más fácil cierra y más valor genera">

        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <FormGroup label="Cargo del decisor">
            <TagInput tags={decisionMakers} onChange={setDM} placeholder="CEO, Gerente..." />
          </FormGroup>
          <FormGroup label="Región geográfica">
            <TagInput tags={regions} onChange={setRegions} placeholder="País, ciudad..." />
          </FormGroup>
          <FormGroup label="Modelo de negocio">
            <TagInput tags={bizModels} onChange={setBiz} placeholder="B2B, B2C..." />
          </FormGroup>
        </div>

        <FormRow>
          <FormGroup label="¿Cuáles son las señales de que un prospecto ES tu cliente ideal?">
            <Textarea value={posSignals.join('\n')} onChange={v => setPos(v.split('\n').filter(Boolean))}
              rows={4}
              placeholder="Ej. Tiene más de 3 vendedores, usa Excel para gestionar su pipeline, el dueño se queja de no saber cuánto tiene en la boca de venta..." />
          </FormGroup>
          <FormGroup label="¿Cuáles son las señales de que un prospecto NO es tu cliente ideal?">
            <Textarea value={negSignals.join('\n')} onChange={v => setNeg(v.split('\n').filter(Boolean))}
              rows={4}
              placeholder="Ej. Empresa con menos de $100K de facturación anual, solo quieren precio sin ver valor, no tienen equipo de ventas definido..." />
          </FormGroup>
        </FormRow>
      </Section>

      <Section icon="◈" title="Score de calificación"
        sub="¿Qué tan importante es cada criterio para calificar un lead?">
        <div className="flex flex-col gap-5">
          <Slider label="Tamaño de empresa"
            value={scoring.companySize} onChange={v => updateScore('companySize', v)} />
          <Slider label="Cargo del contacto (decisor vs. influenciador)"
            value={scoring.decisionMakerRole} onChange={v => updateScore('decisionMakerRole', v)} />
          <Slider label="Urgencia del dolor"
            value={scoring.painUrgency} onChange={v => updateScore('painUrgency', v)} />
          <Slider label="Capacidad de inversión"
            value={scoring.budget} onChange={v => updateScore('budget', v)} />
        </div>

        {/* ICP Score preview */}
        <div className="mt-5 p-3 rounded-lg flex items-center gap-3"
          style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(108,99,255,0.2)', color: 'var(--accent2)' }}>
            ✦
          </div>
          <div className="text-[11.5px] text-velox-text2 leading-relaxed">
            Un prospecto que cumple todos los criterios anteriores recibirá un{' '}
            <strong className="text-velox-text">ICP score máximo</strong> y aparecerá como
            prioridad en el Agente. El score se calcula automáticamente al crear cada contacto.
          </div>
        </div>
      </Section>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Continuar → Proceso comercial"
        saving={saving} step={4} />
    </div>
  )
}
