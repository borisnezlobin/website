import type { EffectId } from '../worker/protocol'
import Image from 'next/image'
import { assetUrl } from '../lib/assets'

interface EffectOption {
  id: EffectId
  name: string
  thumbnail: string
}

const EFFECTS: EffectOption[] = [
  { id: 'knife', name: 'Palette knife', thumbnail: assetUrl('/thumbs/knife.jpg') },
  { id: 'ink', name: 'Smear & bleed', thumbnail: assetUrl('/thumbs/ink.jpg') },
]

interface EffectPickerProps {
  value: EffectId
  onChange: (effect: EffectId) => void
}

export function EffectPicker({ value, onChange }: EffectPickerProps) {
  return (
    <div role="radiogroup" aria-label="Effect" className="grid grid-cols-2 gap-3">
      {EFFECTS.map((effect) => {
        const selected = effect.id === value
        return (
          <button
            key={effect.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(effect.id)}
            className={`group relative flex flex-col gap-2 rounded-[var(--radius-panel)] p-1.5 text-start transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.96] ${
              selected ? 'bg-[rgb(var(--paint-raised))] [box-shadow:var(--shadow-ring)]' : 'hover:bg-[rgb(var(--paint-raised))]'
            }`}
          >
            <Image src={effect.thumbnail} alt="" width={360} height={360} priority className="aspect-square w-full rounded-[calc(var(--radius-panel)-0.375rem)] object-cover outline outline-1 -outline-offset-1 outline-black/10" />
            <span className={`px-1.5 pb-1 text-sm font-semibold ${selected ? 'text-[rgb(var(--paint-ink))]' : 'text-[rgb(var(--paint-ink-muted))] group-hover:text-[rgb(var(--paint-ink))]'}`}>{effect.name}</span>
          </button>
        )
      })}
    </div>
  )
}
