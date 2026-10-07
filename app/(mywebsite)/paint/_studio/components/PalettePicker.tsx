import { ImageSquare, Palette } from '@phosphor-icons/react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { hexToRgb, rgbToHex, type Rgb } from '../engine/color'
import { ColorWell } from './ColorInput'

interface PalettePreset {
  id: string
  name: string
  colors: string[]
}

const PRESETS: PalettePreset[] = [
  { id: 'coast', name: 'Coast', colors: ['#1f6f8b', '#4fb0c6', '#f2c57c', '#e98a5c', '#2b3a55'] },
  { id: 'ember', name: 'Ember', colors: ['#c0392b', '#e67e22', '#f4c26b', '#5b2c2c', '#2d2a32'] },
  { id: 'orchard', name: 'Orchard', colors: ['#3f7d4e', '#a3c46c', '#f2d16b', '#e07a5f', '#33413a'] },
  { id: 'dusk', name: 'Dusk', colors: ['#5b4b8a', '#9b7fc4', '#f0a6ca', '#f6d6ad', '#26244a'] },
  { id: 'ink', name: 'Ink', colors: ['#1b2a49', '#3d5a80', '#98c1d9', '#e0fbfc', '#293241'] },
  { id: 'chalk', name: 'Chalk', colors: ['#2b2b2b', '#5c5c5c', '#9a9a9a', '#d0d0d0', '#f0eee9'] },
]

const PHOTO = 'photo'
const CUSTOM = 'custom'
const STARTING_CUSTOM = ['#2a9d8f', '#e9c46a', '#e76f51']

interface PalettePickerProps {
  value: Rgb[]
  onChange: (palette: Rgb[]) => void
}

interface Choice {
  id: string
  name: string
  swatch: ReactNode
}

function toPalette(colors: string[]): Rgb[] {
  return colors.map(hexToRgb)
}

function selectedChoice(value: Rgb[]): string {
  if (value.length === 0) return PHOTO
  const hexes = value.map(rgbToHex).join()
  return PRESETS.find((preset) => preset.colors.join() === hexes)?.id ?? CUSTOM
}

function Dots({ colors }: { colors: string[] }) {
  return (
    <span aria-hidden className="flex -space-x-1.5">
      {colors.slice(0, 4).map((color, index) => (
        <span key={index} className="size-4 rounded-full [box-shadow:0_0_0_1.5px_var(--color-panel)]" style={{ background: color }} />
      ))}
    </span>
  )
}

function choicesFor(custom: string[]): Choice[] {
  return [
    { id: PHOTO, name: 'Matched to your photo', swatch: <ImageSquare size={20} weight="bold" /> },
    ...PRESETS.map((preset) => ({ id: preset.id, name: preset.name, swatch: <Dots colors={preset.colors} /> })),
    { id: CUSTOM, name: 'Your own colors', swatch: <span className="flex items-center gap-1"><Palette size={18} weight="bold" /><Dots colors={custom} /></span> },
  ]
}

const ARROW_STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

export function PalettePicker({ value, onChange }: PalettePickerProps) {
  const [custom, setCustom] = useState(STARTING_CUSTOM)
  const labelId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const selected = selectedChoice(value)
  const choices = choicesFor(custom)

  const choose = (id: string) => {
    if (id === PHOTO) return onChange([])
    if (id === CUSTOM) return onChange(toPalette(custom))
    onChange(toPalette(PRESETS.find((preset) => preset.id === id)?.colors ?? []))
  }

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = ARROW_STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const next = (index + step + choices.length) % choices.length
    buttons.current[next]?.focus()
    choose(choices[next].id)
  }

  const editCustom = (index: number, color: Rgb) => {
    const next = value.map((current, n) => (n === index ? color : current))
    setCustom(next.map(rgbToHex))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-label">
        Colors around the subject
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-4 gap-2">
        {choices.map((choice, index) => {
          const isSelected = choice.id === selected
          return (
            <button
              key={choice.id}
              ref={(element) => {
                buttons.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={choice.name}
              title={choice.name}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => choose(choice.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`grid h-10 place-items-center rounded-[var(--radius-control)] text-[rgb(var(--paint-ink-muted))] transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.96] ${isSelected ? 'bg-[rgb(var(--paint-raised))] text-[rgb(var(--paint-ink))] [box-shadow:var(--shadow-ring)]' : 'hover:bg-[rgb(var(--paint-raised))]'}`}
            >
              {choice.swatch}
            </button>
          )
        })}
      </div>
      {selected === CUSTOM && (
        <div className="flex gap-3 pt-1">
          {value.map((color, index) => (
            <ColorWell key={index} label={`Color ${index + 1} of ${value.length}`} value={color} onChange={(next) => editCustom(index, next)} />
          ))}
        </div>
      )}
    </div>
  )
}
