'use client'

import { useState } from 'react'
import { type StepProps, type SILData, PageHeader, Section, FormRow, FormGroup, Input, Select, TagInput, NavButtons } from './shared'

type Segment = NonNullable<SILData['segments']>[number]

const SIZES = [
  { value: '1-10',   label: '1 a 10 empleados' },
  { value: '11-50',  label: '11 a 50 empleados' },
  { value: '51-200', label: '51 a 200 empleados' },
  { value: '200+',   label: 'Más de 200' },
]

export function StepSegments({ sil, onNext, onBack, saving }: StepProps) {
  const [segments, setSegments] = useState<Segment[]>(
    sil.segments?.length
      ? sil.segments
      : [{ id: '1', name: '', size: '11-50', revenue: '', industries: [], mainPain: '', recommendedProduct: '' }]
  )

  const addSegment = () => setSegments(s => [
    ...s,
    { id: Date.now().toString(), name: '', size: '11-50', revenue: '', industries: [], mainPain: '', recommendedProduct: '' }
  ])

  const removeSegment = (id: string) => setSegments(s => s.filter(x => x.id !== id))

  const update = (id: string, field: keyof Segment, value: unknown) =>
    setSegments(s => s.map(x => x.id === id ? { ...x, [field]: value } : x))

  const productOptions = [
    { value: '', label: 'Seleccionar...' },
    ...(sil.portfolio ?? []).map(p => ({ value: p.name, label: p.name })),
  ]

  const handleNext = () => onNext({ segments }, 4)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 4 de 6"
        title="Tus segmentos de mercado"
        desc="Define los grupos de clientes a los que sirves. El Agente usará esto para adaptar el mensaje y recomendar el producto correcto por segmento."
      />

      {segments.map((seg, idx) => (
        <Section
          key={seg.id}
          icon="◫"
          title={`Segmento ${idx + 1}${idx === 0 ? ' — Principal' : ''}`}
          sub={idx === 0 ? 'El mercado donde más cierras hoy' : 'Mercado secundario'}>

          <FormRow>
            <FormGroup label="Nombre del segmento" required>
              <Input value={seg.name} onChange={v => update(seg.id, 'name', v)}
                placeholder="Ej. PYMEs del sector salud" />
            </FormGroup>
            <FormGroup label="Tamaño de empresa">
              <Select value={seg.size ?? '11-50'} onChange={v => update(seg.id, 'size', v)} options={SIZES} />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup label="Rango de facturación anual">
              <Input value={seg.revenue ?? ''} onChange={v => update(seg.id, 'revenue', v)}
                placeholder="Ej. $500K a $2M USD" />
            </FormGroup>
            <FormGroup label="Industrias incluidas">
              <TagInput
                tags={seg.industries ?? []}
                onChange={v => update(seg.id, 'industries', v)}
                placeholder="Agregar industria y Enter..." />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup label="Dolor más frecuente en este segmento">
              <Input value={seg.mainPain ?? ''} onChange={v => update(seg.id, 'mainPain', v)}
                placeholder="El problema más común antes de conocerte" />
            </FormGroup>
            {sil.portfolio?.length ? (
              <FormGroup label="Producto recomendado para este segmento">
                <Select
                  value={seg.recommendedProduct ?? ''}
                  onChange={v => update(seg.id, 'recommendedProduct', v)}
                  options={productOptions} />
              </FormGroup>
            ) : null}
          </FormRow>

          {idx > 0 && (
            <button onClick={() => removeSegment(seg.id)}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors mt-1">
              — Eliminar este segmento
            </button>
          )}
        </Section>
      ))}

      <button onClick={addSegment}
        className="w-full py-2.5 rounded-xl text-sm text-velox-text3 border border-dashed mb-4 transition-all
          hover:border-velox-accent hover:text-velox-accent2 hover:bg-velox-accent/5"
        style={{ borderColor: 'var(--border2)' }}>
        + Agregar otro segmento
      </button>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Continuar → Perfil de cliente ideal"
        saving={saving} step={3} />
    </div>
  )
}
