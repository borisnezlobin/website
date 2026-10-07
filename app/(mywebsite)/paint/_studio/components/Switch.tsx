import { useId } from 'react'

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-[background-color] duration-150 ${checked ? 'bg-[rgb(var(--paint-ink))]' : 'bg-[rgb(var(--paint-raised))]'}`}
      >
        <span className={`absolute top-1 left-1 size-5 rounded-full [box-shadow:var(--paint-shadow-raised)] transition-[translate,background-color] duration-150 ease-[var(--ease-out-soft)] ${checked ? 'translate-x-5 bg-[rgb(var(--paint-surface))]' : 'bg-[rgb(var(--paint-ink))]'}`} />
      </button>
    </div>
  )
}
