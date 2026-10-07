import { useId } from 'react'
import { hexToRgb, rgbToHex, type Rgb } from '../engine/color'

interface ColorWellProps {
  id?: string
  label?: string
  value: Rgb
  onChange: (value: Rgb) => void
}

export function ColorWell({ id, label, value, onChange }: ColorWellProps) {
  const hex = rgbToHex(value)
  return (
    <span className="relative size-9 shrink-0 overflow-hidden rounded-full [box-shadow:var(--paint-shadow-raised)]" style={{ background: hex }}>
      <input id={id} aria-label={label} type="color" value={hex} onChange={(event) => onChange(hexToRgb(event.target.value))} className="absolute inset-0 size-full cursor-pointer opacity-0" />
    </span>
  )
}

interface ColorInputProps {
  label: string
  value: Rgb
  onChange: (value: Rgb) => void
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <ColorWell id={id} value={value} onChange={onChange} />
    </div>
  )
}
