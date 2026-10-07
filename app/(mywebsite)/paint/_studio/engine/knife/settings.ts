import type { Rgb } from '../color'

export interface KnifeSettings {
  canvas: Rgb
  strokeSize: number
  detail: number
  colorBoost: number
  coolShadows: number
  hueJitter: number
  haloAmount: number
  haloSpread: number
  haloAngle: number
  dryBrush: number
  drips: number
  dripLength: number
  splatter: number
  relief: number
  dissolve: number
  margin: number
  dirt: number
  haloBlend: number
  haloPalette: Rgb[]
  seed: number
}

export const defaultKnifeSettings: KnifeSettings = {
  canvas: [0.871, 0.871, 0.875],
  strokeSize: 0.022,
  detail: 0.6,
  colorBoost: 2.1,
  coolShadows: 0.65,
  hueJitter: 0.25,
  haloAmount: 0.8,
  haloSpread: 0.42,
  haloAngle: -0.3,
  dryBrush: 0.5,
  drips: 0.5,
  dripLength: 0.35,
  splatter: 0.4,
  relief: 0.7,
  dissolve: 0.5,
  margin: 0.15,
  dirt: 0.5,
  haloBlend: 0.3,
  haloPalette: [],
  seed: 11,
}
