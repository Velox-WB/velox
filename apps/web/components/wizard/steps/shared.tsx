'use client'

import { type SILData } from '../SetupWizardClient'

export interface StepProps {
  sil: SILData
  onNext: (data: Partial<SILData>, nextStep: number) => Promise<void>
  onBack: () => void
  saving: boolean
}

// ── Shared UI primitives ────────────────────────────────────────────────────

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-7">
      <div className="font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-velox-accent2 mb-2">{eyebrow}</div>
      <h1 className="font-syne text-2xl font-black text-velox-text tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-velox-text2 leading-relaxed max-w-xl">{desc}</p>
    </div>
  )
}

export function Section({ icon, title, sub, children }: {
  icon: string; title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <div className="velox-card mb-4 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent2)' }}>
          {icon}
        </div>
        <div>
          <div className="font-syne text-[13px] font-bold text-velox-text">{title}</div>
          {sub && <div className="text-[11px] text-velox-text3">{sub}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-3 mb-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  )
}

export function FormGroup({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="velox-label">
        {label} {required && <span className="text-velox-accent">*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input type={type} className="velox-input" value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea className="velox-input resize-none" value={value} rows={rows}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  )
}

export function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select className="velox-input cursor-pointer" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (tags: string[]) => void; placeholder?: string
}) {
  const removeTag = (i: number) => onChange(tags.filter((_, idx) => idx !== i))
  const addTag = (val: string) => {
    const v = val.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
  }

  return (
    <div className="velox-input flex flex-wrap gap-1.5 min-h-[44px] cursor-text"
      onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-medium"
          style={{ background: 'rgba(108,99,255,0.18)', color: 'var(--accent2)', border: '1px solid rgba(108,99,255,0.3)' }}>
          {t}
          <button onClick={() => removeTag(i)} className="opacity-60 hover:opacity-100 transition-opacity leading-none">×</button>
        </span>
      ))}
      <input className="bg-transparent outline-none text-sm text-velox-text placeholder:text-velox-text3 flex-1 min-w-[80px]"
        placeholder={tags.length === 0 ? placeholder : 'Agregar...'}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = ''
          }
        }}
        onBlur={e => { if (e.target.value) { addTag(e.target.value); e.target.value = '' } }}
      />
    </div>
  )
}

export function NavButtons({ onBack, onNext, nextLabel = 'Continuar →', saving, step, isFirst }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string
  saving?: boolean; step: number; isFirst?: boolean
}) {
  return (
    <div className="flex justify-between items-center pt-6">
      {!isFirst ? (
        <button onClick={onBack} className="velox-btn-ghost">← Atrás</button>
      ) : <div />}
      <button onClick={onNext} disabled={saving} className="velox-btn-primary min-w-[180px]">
        {saving ? 'Guardando...' : nextLabel}
      </button>
    </div>
  )
}

export function Slider({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="velox-label">{label}</span>
        <span className="font-syne text-xs font-bold text-velox-accent2">{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-velox-accent"
        style={{ background: `linear-gradient(to right, var(--accent) ${(value/max)*100}%, var(--surface2) ${(value/max)*100}%)` }}
      />
    </div>
  )
}
