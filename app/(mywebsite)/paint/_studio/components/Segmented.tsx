import type { ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon: ReactNode
}

interface SegmentedProps<T extends string> {
  label: string
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-[calc(var(--radius-control)+0.25rem)] bg-[rgb(var(--paint-surface))] p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-semibold transition-[background-color,color] duration-150 ${
              selected ? 'bg-[rgb(var(--paint-raised))] text-[rgb(var(--paint-ink))] [box-shadow:var(--paint-shadow-raised)]' : 'text-[rgb(var(--paint-ink-faint))] hover:text-[rgb(var(--paint-ink))]'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
