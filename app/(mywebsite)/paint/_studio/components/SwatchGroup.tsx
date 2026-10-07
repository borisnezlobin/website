export interface SwatchOption<T> {
  value: T
  label: string
  color: string
}

interface SwatchGroupProps<T> {
  label: string
  options: SwatchOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SwatchGroup<T extends string | number>({ label, options, value, onChange }: SwatchGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={`grid size-10 place-items-center rounded-full transition-[box-shadow,scale] duration-150 active:scale-[0.96] ${selected ? '[box-shadow:var(--shadow-ring)]' : 'hover:scale-105'}`}
            >
              <span className="size-7 rounded-full" style={{ background: `radial-gradient(circle at 50% 50%, ${option.color} 45%, color-mix(in oklch, ${option.color} 35%, transparent) 100%)` }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
