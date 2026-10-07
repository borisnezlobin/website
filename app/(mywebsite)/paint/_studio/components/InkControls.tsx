import { Eraser, Eyedropper, HandSwipeRight, Shuffle, X } from '@phosphor-icons/react'
import { rgbToHex } from '../engine/color'
import type { InkSettings } from '../engine/ink'
import { AngleDial } from './AngleDial'
import { Button } from './Button'
import { Disclosure } from './Disclosure'
import { Slider } from './Slider'
import { SwatchGroup, type SwatchOption } from './SwatchGroup'
import { Switch } from './Switch'

const HALO_LEANS: SwatchOption<0 | 1 | 2>[] = [
  { value: 0, label: 'Cyan travels furthest', color: 'oklch(0.72 0.13 230)' },
  { value: 1, label: 'Magenta travels furthest', color: 'oklch(0.66 0.2 350)' },
  { value: 2, label: 'Yellow travels furthest', color: 'oklch(0.86 0.15 95)' },
]

export type InkTool = 'none' | 'smear' | 'pick'

export interface InkToolState {
  active: InkTool
  fingerRadius: number
  onChange: (tool: InkTool) => void
  onFingerRadius: (radius: number) => void
}

interface InkControlsProps {
  settings: InkSettings
  imageLongSide: number
  isolated: boolean
  tool: InkToolState
  onChange: (changes: Partial<InkSettings>) => void
  onRemoveInk: (index: number) => void
  onClearSmudges: () => void
}

function PickedInks({ settings, tool, onRemoveInk, onChange }: Pick<InkControlsProps, 'settings' | 'tool' | 'onRemoveInk' | 'onChange'>) {
  const picking = tool.active === 'pick'
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-panel)] bg-[rgb(var(--paint-surface))] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {settings.wetColors.length === 0 && <span className="text-caption flex-1">Only smeared paint and the darkest inks bleed.</span>}
        {settings.wetColors.map((color, index) => (
          <button
            key={`${rgbToHex(color)}-${index}`}
            type="button"
            onClick={() => onRemoveInk(index)}
            aria-label={`Stop ${rgbToHex(color)} from running`}
            className="group relative size-9 rounded-full [box-shadow:var(--paint-shadow-raised)] transition-[scale] duration-150 active:scale-[0.96]"
            style={{ background: rgbToHex(color) }}
          >
            <X size={14} weight="bold" className="absolute inset-0 m-auto text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <Button variant={picking ? 'primary' : 'quiet'} aria-pressed={picking} icon={<Eyedropper size={18} weight="bold" />} onClick={() => tool.onChange(picking ? 'none' : 'pick')}>
        {picking ? 'Click inks on the image' : 'Choose which inks run'}
      </Button>
      {settings.wetColors.length > 0 && <Slider label="Match colors loosely" value={settings.colorTolerance} min={0.04} max={0.3} onChange={(colorTolerance) => onChange({ colorTolerance })} />}
    </div>
  )
}

function FingerSmear({ tool, hasSmudges, onClearSmudges }: { tool: InkToolState; hasSmudges: boolean; onClearSmudges: () => void }) {
  const smearing = tool.active === 'smear'
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-panel)] bg-[rgb(var(--paint-surface))] p-3">
      <div className="flex gap-2">
        <Button variant={smearing ? 'primary' : 'quiet'} aria-pressed={smearing} icon={<HandSwipeRight size={18} weight="bold" />} onClick={() => tool.onChange(smearing ? 'none' : 'smear')} className="flex-1 justify-center">
          {smearing ? 'Drag on the image to smear' : 'Smear with your finger'}
        </Button>
        <Button variant="ghost" iconOnly icon={<Eraser size={18} weight="bold" />} onClick={onClearSmudges} disabled={!hasSmudges}>
          Undo all finger smears
        </Button>
      </div>
      {smearing && <Slider label="Finger size" value={tool.fingerRadius} min={6} max={120} step={1} format={(v) => `${Math.round(v)} px`} onChange={tool.onFingerRadius} />}
    </div>
  )
}

interface SectionProps {
  settings: InkSettings
  pixels: (fraction: number) => string
  onChange: (changes: Partial<InkSettings>) => void
}

function SwipeControls({ settings, pixels, onChange }: SectionProps) {
  const swiping = settings.smearAmount > 0
  return (
    <>
      <Slider label="Swipes" value={settings.smearAmount} min={0} max={1} onChange={(smearAmount) => onChange({ smearAmount })} />
      {swiping && <AngleDial label="Swipe direction" angle={settings.smearAngle} onChange={(smearAngle) => onChange({ smearAngle })} />}
      {swiping && <Switch label="Keep text readable" checked={settings.keepTextReadable} onChange={(keepTextReadable) => onChange({ keepTextReadable })} />}
      {swiping && <Slider label="Ink carried by each swipe" value={settings.smearCharge} min={0} max={1.5} onChange={(smearCharge) => onChange({ smearCharge })} />}
      {swiping && <Slider label="Swipe length" value={settings.smearLength} min={0.05} max={0.6} step={0.005} format={pixels} onChange={(smearLength) => onChange({ smearLength })} />}
      {swiping && (
        <Button icon={<Shuffle size={18} weight="bold" />} onClick={() => onChange({ swipeSeed: Math.floor(Math.random() * 1e6) })}>
          Swipe somewhere else
        </Button>
      )}
    </>
  )
}

function BladeFineTune({ settings, pixels, onChange }: SectionProps) {
  return (
    <>
      <Slider label="Blade width" value={settings.smearWidth} min={0.01} max={0.25} step={0.005} format={pixels} onChange={(smearWidth) => onChange({ smearWidth })} />
      <Slider label="Pressure" value={settings.smearPressure} min={0} max={0.98} onChange={(smearPressure) => onChange({ smearPressure })} />
      <Slider label="How far paint is dragged" value={settings.smearDrag} min={0.01} max={0.3} step={0.005} format={pixels} onChange={(smearDrag) => onChange({ smearDrag })} />
      <Slider label="Streaks from a nicked blade" value={settings.streaks} min={0} max={1} onChange={(streaks) => onChange({ streaks })} />
      <Slider label="Blade skipping" value={settings.chatter} min={0} max={1} onChange={(chatter) => onChange({ chatter })} />
      <Slider label="How much of the print moves" value={settings.looseness} min={0} max={1} onChange={(looseness) => onChange({ looseness })} />
      <Slider label="How wet smeared paint stays" value={settings.smearWetness} min={0} max={1} onChange={(smearWetness) => onChange({ smearWetness })} />
    </>
  )
}

function BleedFineTune({ settings, pixels, onChange, isolated }: SectionProps & { isolated: boolean }) {
  return (
    <>
      {isolated && <Switch label="Blank paper behind the subject" checked={settings.blankPaper} onChange={(blankPaper) => onChange({ blankPaper })} />}
      <Slider label="Wet ink" value={settings.pooledInk} min={0} max={3} format={(v) => `${v.toFixed(1)}×`} onChange={(pooledInk) => onChange({ pooledInk })} />
      <Slider label="How wet the print starts" value={settings.wetness} min={0} max={1} onChange={(wetness) => onChange({ wetness })} />
      <SwatchGroup label="Color that runs furthest" options={HALO_LEANS} value={settings.haloLean} onChange={(haloLean) => onChange({ haloLean })} />
      <Slider label="Color separation" value={settings.separation} min={0} max={1} onChange={(separation) => onChange({ separation })} />
      <Slider label="Drift while wet" value={settings.drift} min={0} max={0.08} step={0.001} format={pixels} onChange={(drift) => onChange({ drift })} />
      {settings.drift > 0 && <AngleDial label="Drift direction" angle={settings.driftAngle} onChange={(driftAngle) => onChange({ driftAngle })} />}
      <Slider label="Soaks in where it lands" value={settings.hold} min={0} max={0.9} onChange={(hold) => onChange({ hold })} />
      <Slider label="Settles while traveling" value={settings.settle} min={0.05} max={0.98} onChange={(settle) => onChange({ settle })} />
      {settings.wetColors.length === 0 && <Slider label="How dark ink must be to run" value={settings.heavyInkThreshold} min={0.2} max={4} format={(v) => v.toFixed(1)} onChange={(heavyInkThreshold) => onChange({ heavyInkThreshold })} />}
      <Slider label="Paper fibers" value={settings.fiber} min={0} max={0.6} onChange={(fiber) => onChange({ fiber })} />
    </>
  )
}

export function InkControls({ settings, imageLongSide, isolated, tool, onChange, onRemoveInk, onClearSmudges }: InkControlsProps) {
  const pixels = (fraction: number) => `${Math.round(fraction * imageLongSide)} px`
  const section = { settings, pixels, onChange }
  return (
    <div className="flex flex-col gap-5">
      <SwipeControls {...section} />
      <FingerSmear tool={tool} hasSmudges={settings.smudges.length > 0} onClearSmudges={onClearSmudges} />
      <Slider label="Bleed" value={settings.bleedRadius} min={0.003} max={0.08} step={0.001} format={pixels} onChange={(bleedRadius) => onChange({ bleedRadius })} />
      <Slider label="Fade everything else" value={settings.fade} min={0} max={0.9} onChange={(fade) => onChange({ fade })} />
      <PickedInks settings={settings} tool={tool} onRemoveInk={onRemoveInk} onChange={onChange} />
      <Disclosure summary="Fine-tune the blade">
        <BladeFineTune {...section} />
      </Disclosure>
      <Disclosure summary="Fine-tune the bleed">
        <BleedFineTune {...section} isolated={isolated} />
      </Disclosure>
    </div>
  )
}
