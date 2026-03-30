'use client'

import type { SILData } from '../SetupWizardClient'
export type { SILData }
import React from 'react'

export interface StepProps {
  sil: SILData
  onNext: (data: Partial<SILData>, nextStep: number) => Promise<void>
  onBack: () => void
  saving: boolean
}

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-7">
      <div className="font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-velox-accent2 mb-2">{eyebrow}</div>
      <h1 className="font-syne text-2xl font-black text-velox-text tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-velox-text2 leading-relaxed max-w-xl">{desc}</p>
    </div>
  )
}

export function Section({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="velox-card mb-4 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent2)' }}>{icon}</div>
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
  return <div className={`grid gap-3 mb-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{children}</div>
}

export function FormGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="velox-label mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</div>
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" className="velox-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className="velox-input resize-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="velox-input cursor-pointer" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = React.useState('')
  const add = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onChange([...tags, input.trim()])
      setInput('')
    }
  }
  return (
    <div className="velox-input min-h-[38px] flex flex-wrap gap-1.5 items-center cursor-text" onClick={() => document.getElementById('tag-input')?.focus()}>
      {tags.map((t, i) => (
        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent2)' }}>
          {t}<button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">×</button>
        </span>
      ))}
      <input id="tag-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={add} placeholder={tags.length === 0 ? placeholder : ''} className="bg-transparent outline-none text-xs flex-1 min-w-[120px] text-velox-text placeholder:text-velox-text3" />
    </div>
  )
}

export function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-velox-text2 flex-1">{label}</div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-32 h-1 rounded-full appearance-none cursor-pointer" />
      <div className="font-syne font-bold text-xs w-6 text-right" style={{ color: 'var(--accent2)' }}>{value}</div>
    </div>
  )
}

export function NavButtons({ onBack, onNext, nextLabel, saving, step }: { onBack: () => void; onNext: () => void; nextLabel: string; saving: boolean; step: number }) {
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      {step > 0 ? <button onClick={onBack} className="velox-btn-ghost">← Atrás</button> : <div />}
      <button onClick={onNext} disabled={saving} className="velox-btn-primary">
        {saving ? 'Guardando...' : nextLabel}
      </button>
    </div>
  )
}
