'use client'

import { useState } from 'react'
import { type StepProps, PageHeader, Section, FormRow, FormGroup, Input, Textarea, Select, TagInput, NavButtons } from './shared'

const SECTORS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'tech', label: 'Tecnología y software' },
  { value: 'manufacturing', label: 'Manufactura' },
  { value: 'professional', label: 'Servicios profesionales' },
  { value: 'distribution', label: 'Distribución y logística' },
  { value: 'health', label: 'Salud y bienestar' },
  { value: 'construction', label: 'Construcción y bienes raíces' },
  { value: 'food', label: 'Alimentos y bebidas' },
  { value: 'retail', label: 'Retail y comercio' },
  { value: 'education', label: 'Educación' },
  { value: 'other', label: 'Otro' },
]

const TEAM_SIZES = [
  { value: 'solo', label: 'Solo el dueño' },
  { value: '2-5', label: '2 a 5 vendedores' },
  { value: '6-15', label: '6 a 15 vendedores' },
  { value: '15+', label: 'Más de 15' },
]

export function StepBusiness({ sil, onNext, onBack, saving }: StepProps) {
  const b = sil.business ?? {}
  const [name, setName]           = useState(b.name ?? '')
  const [sector, setSector]       = useState(b.sector ?? '')
  const [description, setDesc]    = useState(b.description ?? '')
  const [years, setYears]         = useState(String(b.yearsInMarket ?? ''))
  const [teamSize, setTeamSize]   = useState(b.teamSize ?? 'solo')
  const [diff, setDiff]           = useState(b.differentiators ?? '')
  const [competitors, setComp]    = useState<string[]>(b.competitors ?? [])

  const handleNext = () => onNext({
    business: {
      name, sector, description,
      yearsInMarket: years ? Number(years) : undefined,
      teamSize, differentiators: diff, competitors,
    }
  }, 1)

  return (
    <div>
      <PageHeader
        eyebrow="Paso 1 de 6"
        title="Cuéntame sobre tu negocio"
        desc="Esta información le da contexto a tu Agente IA. Cuanto más específico seas, mejores serán sus recomendaciones desde el primer día."
      />

      <Section icon="◈" title="Información básica" sub="Cómo se presenta tu empresa al mundo">
        <FormRow>
          <FormGroup label="Nombre de la empresa" required>
            <Input value={name} onChange={setName} placeholder="Ej. Tecnologías del Valle S.A." />
          </FormGroup>
          <FormGroup label="Industria / sector" required>
            <Select value={sector} onChange={setSector} options={SECTORS} />
          </FormGroup>
        </FormRow>
        <FormGroup label="¿Qué hace tu empresa?" required>
          <Textarea value={description} onChange={setDesc} rows={3}
            placeholder="Describe en 2-3 oraciones qué problema resuelve tu empresa y a quién le sirve. El Agente usará esto como contexto base." />
        </FormGroup>
        <FormRow>
          <FormGroup label="Años en el mercado">
            <Input value={String(years)} onChange={setYears} placeholder="Ej. 8" />
          </FormGroup>
          <FormGroup label="Tamaño del equipo de ventas">
            <Select value={teamSize} onChange={setTeamSize} options={TEAM_SIZES} />
          </FormGroup>
        </FormRow>
      </Section>

      <Section icon="◎" title="Diferenciación" sub="Lo que te hace diferente a la competencia">
        <FormGroup label="¿Por qué te eligen a ti y no a la competencia?">
          <Textarea value={diff} onChange={setDiff} rows={3}
            placeholder="Ej. Somos los únicos en la región con certificación XYZ, entregamos en 24h, llevamos 10 años especializados en PYMEs del sector salud..." />
        </FormGroup>
        <div className="mt-3">
          <FormGroup label="Competidores principales">
            <TagInput tags={competitors} onChange={setComp} placeholder="Escribir y presionar Enter..." />
          </FormGroup>
        </div>
      </Section>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Continuar → Portafolio"
        saving={saving} step={0} />
    </div>
  )
}
