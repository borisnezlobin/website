import { Shuffle } from '@phosphor-icons/react'
import type { KnifeSettings } from '../engine/knife'
import { AngleDial } from './AngleDial'
import { Button } from './Button'
import { ColorInput } from './ColorInput'
import { Disclosure } from './Disclosure'
import { PalettePicker } from './PalettePicker'
import { Slider } from './Slider'

interface KnifeControlsProps {
  settings: KnifeSettings
  imageLongSide: number
  isolated: boolean
  onChange: (changes: Partial<KnifeSettings>) => void
}

export function KnifeControls({ settings, imageLongSide, isolated, onChange }: KnifeControlsProps) {
  const pixels = (fraction: number) => `${Math.round(fraction * imageLongSide)} px`
  return (
    <div className="flex flex-col gap-5">
      <Slider label="Stroke size" value={settings.strokeSize} min={0.008} max={0.045} step={0.001} format={pixels} onChange={(strokeSize) => onChange({ strokeSize })} />
      <Slider label="Detail" value={settings.detail} min={0} max={1} onChange={(detail) => onChange({ detail })} />
      <Slider label="Color" value={settings.colorBoost} min={0.6} max={3} format={(v) => `${v.toFixed(1)}×`} onChange={(colorBoost) => onChange({ colorBoost })} />
      {isolated && <Slider label="Strokes around the subject" value={settings.haloAmount} min={0} max={1.5} onChange={(haloAmount) => onChange({ haloAmount })} />}
      {isolated && settings.haloAmount > 0 && <PalettePicker value={settings.haloPalette} onChange={(haloPalette) => onChange({ haloPalette })} />}
      <Slider label="Drips" value={settings.drips} min={0} max={1.5} onChange={(drips) => onChange({ drips })} />
      <Slider label="Dirty knife" value={settings.dirt} min={0} max={1.5} onChange={(dirt) => onChange({ dirt })} />
      <Button icon={<Shuffle size={18} weight="bold" />} onClick={() => onChange({ seed: Math.floor(Math.random() * 1e6) })}>
        Repaint with new strokes
      </Button>
      <Disclosure summary="Fine-tune">
        {isolated && <Slider label="How far strokes reach" value={settings.haloSpread} min={0.1} max={0.8} onChange={(haloSpread) => onChange({ haloSpread })} />}
        {isolated && <Slider label="Blend strokes near the subject" value={settings.haloBlend} min={0} max={1} onChange={(haloBlend) => onChange({ haloBlend })} />}
        {isolated && <AngleDial label="Stroke direction" angle={settings.haloAngle} onChange={(haloAngle) => onChange({ haloAngle })} />}
        {isolated && <Slider label="Dry brush at the edges" value={settings.dryBrush} min={0} max={1} onChange={(dryBrush) => onChange({ dryBrush })} />}
        {isolated && <Slider label="Fade out at the bottom" value={settings.dissolve} min={0} max={1} onChange={(dissolve) => onChange({ dissolve })} />}
        <Slider label="Drip length" value={settings.dripLength} min={0.05} max={0.8} onChange={(dripLength) => onChange({ dripLength })} />
        <Slider label="Splatter" value={settings.splatter} min={0} max={1} onChange={(splatter) => onChange({ splatter })} />
        <Slider label="Paint thickness" value={settings.relief} min={0} max={1.5} onChange={(relief) => onChange({ relief })} />
        <Slider label="Cool shadows" value={settings.coolShadows} min={0} max={1} onChange={(coolShadows) => onChange({ coolShadows })} />
        <Slider label="Color variety" value={settings.hueJitter} min={0} max={0.8} onChange={(hueJitter) => onChange({ hueJitter })} />
        <ColorInput label="Canvas" value={settings.canvas} onChange={(canvas) => onChange({ canvas })} />
      </Disclosure>
    </div>
  )
}
