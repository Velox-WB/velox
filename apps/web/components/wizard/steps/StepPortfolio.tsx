'use client'

import { useState } from 'react'
import { type StepProps, type SILData, PageHeader, Section, FormGroup, Textarea, TagInput, NavButtons } from './shared'

type Product = NonNullable<SILData['portfolio']>[number]

const PRODUCT_TYPES = ['flagship', 'upsell', 'addon', 'entry'] as const

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  flagship: { label: 'Flagship',  color: 'rgba(34,211,160,0.15)' },
  upsell:   { label: 'Upsell',    color: 'rgba(245,158,11,0.15)' },
  addon:    { label: 'Addon',     color: 'rgba(108,99,255,0.15)' },
  entry:    { label: 'Entrada',   color: 'rgba(96,165,250,0.15)' },
}

const TYPE_TEXT: Record<string, string> = {
  flagship: 'var(--green)',
  upsell:   'var(--amber)',
  addon:    'var(--accent2)',
  entry:    'var(--blue)',
}

export function StepPortfolio({ sil, onNext, onBack, saving }: StepProps) {
  const [products, setProducts] = useState<Product[]>(
    sil.portfolio ?? [
      { id: '1', name: '', category: '', price: 0, type: 'flagship' },
    ]
  )
  const [pains, setPains]      = useState<string[]>(sil.pains ?? [])
  const [painCost, setPainCost] = useState(sil.painCost ?? '')

  const addProduct = () => setProducts(p => [
    ...p,
    { id: Date.now().toString(), name: '', category: '', price: 0, type: 'addon' }
  ])

  const removeProduct = (id: string) => setProducts(p => p.filter(x => x.id !== id))

  const updateProduct = (id: string, field: keyof Product, value: string | number) =>
    setProducts(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))

  const handleNext = () => onNext({ portfolio: products, pains, painCost }, 2)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 2 de 6"
        title="Tu portafolio de soluciones"
        desc="Agrega cada producto o servicio que ofreces. El Agente aprenderá a recomendar la solución correcta para cada tipo de cliente."
      />

      <Section icon="◇" title="Productos y servicios" sub="Agrega todo tu portafolio actual">
        <div className="flex flex-col gap-2 mb-3">
          {/* Table header */}
          <div className="grid gap-3 px-3 pb-1" style={{ gridTemplateColumns: '1fr 120px 110px 80px 28px' }}>
            {['Nombre del producto/servicio', 'Categoría', 'Precio', 'Tipo', ''].map((h, i) => (
              <div key={i} className="velox-label">{h}</div>
            ))}
          </div>

          {products.map(p => (
            <div key={p.id}
              className="grid gap-3 items-center px-3 py-2 rounded-lg"
              style={{ gridTemplateColumns: '1fr 120px 110px 80px 28px', background: 'var(--surface)', border: '1px solid var(--border)' }}>

              <input className="velox-input py-1.5 px-2.5 text-xs" value={p.name}
                onChange={e => updateProduct(p.id, 'name', e.target.value)}
                placeholder="Nombre del producto..." />

              <input className="velox-input py-1.5 px-2.5 text-xs" value={p.category}
                onChange={e => updateProduct(p.id, 'category', e.target.value)}
                placeholder="Categoría" />

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-velox-text3 text-xs">$</span>
                <input type="number" className="velox-input py-1.5 pl-6 pr-2 text-xs" value={p.price || ''}
                  onChange={e => updateProduct(p.id, 'price', Number(e.target.value))}
                  placeholder="0" />
              </div>

              <select className="velox-input py-1.5 px-2 text-xs cursor-pointer" value={p.type}
                onChange={e => updateProduct(p.id, 'type', e.target.value as Product['type'])}
                style={{ color: TYPE_TEXT[p.type] }}>
                {PRODUCT_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t].label}</option>
                ))}
              </select>

              <button onClick={() => removeProduct(p.id)}
                className="w-7 h-7 rounded-md border flex items-center justify-center text-velox-text3 text-sm
                  hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all"
                style={{ borderColor: 'var(--border2)' }}>
                ×
              </button>
            </div>
          ))}
        </div>

        <button onClick={addProduct}
          className="w-full py-2 rounded-lg text-sm text-velox-text3 border border-dashed transition-all
            hover:border-velox-accent hover:text-velox-accent2 hover:bg-velox-accent/5"
          style={{ borderColor: 'var(--border2)' }}>
          + Agregar producto o servicio
        </button>
      </Section>

      <Section icon="⚡" title="Dolores que resuelves" sub="Los problemas reales que eliminas del negocio del cliente">
        <FormGroup label="Lista los problemas principales que tu solución resuelve" required>
          <TagInput tags={pains} onChange={setPains}
            placeholder="Escribir el dolor y presionar Enter..." />
        </FormGroup>

        <div className="mt-3">
          <FormGroup label="¿Cuál es el costo promedio de NO resolver estos problemas?">
            <Textarea value={painCost} onChange={setPainCost} rows={3}
              placeholder="Ej. Una PYME pierde en promedio $3,000/mes en oportunidades no seguidas. El proceso manual toma 8 horas semanales del equipo..." />
          </FormGroup>
        </div>
      </Section>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Continuar → Propuesta de valor"
        saving={saving} step={1} />
    </div>
  )
}
