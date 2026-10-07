import { oklchToSrgb, srgbToOklch, type Rgb } from '../color'
import type { Random } from '../random'
import { smoothstep, type Field, type RgbImage } from '../raster'

const COOL_HUE = (268 * Math.PI) / 180
const WARM_HUE = (62 * Math.PI) / 180

export interface ColorStyle {
  colorBoost: number
  coolShadows: number
  hueJitter: number
}

function mixAngle(from: number, to: number, amount: number): number {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from))
  return from + delta * amount
}

export function expressiveColor(rgb: readonly number[], style: ColorStyle, regionLightness?: number): Rgb {
  const [lightness, chroma, hue] = srgbToOklch(rgb)
  const shadow = 1 - smoothstep(0.22, 0.62, regionLightness ?? lightness)
  const highlight = smoothstep(0.62, 0.95, lightness)
  const neutral = 1 - smoothstep(0.012, 0.03, chroma)
  const baseHue = neutral > 0.5 ? COOL_HUE : hue
  const warmedHue = mixAngle(baseHue, WARM_HUE, highlight * 0.08 * (1 - neutral))
  const boostedChroma = softChroma(chroma * style.colorBoost)
  const [cooledChroma, cooledHue] = mixTowardCool(boostedChroma, warmedHue, shadow * style.coolShadows * 0.7)
  const curvedLightness = 0.5 + (lightness - 0.5) * 1.12
  return oklchToSrgb([curvedLightness, cooledChroma, cooledHue])
}

const COOL_PIGMENT_CHROMA = 0.09

function mixTowardCool(chroma: number, hue: number, amount: number): [number, number] {
  const a = chroma * Math.cos(hue) * (1 - amount) + COOL_PIGMENT_CHROMA * Math.cos(COOL_HUE) * amount
  const b = chroma * Math.sin(hue) * (1 - amount) + COOL_PIGMENT_CHROMA * Math.sin(COOL_HUE) * amount
  return [Math.hypot(a, b), Math.atan2(b, a)]
}

const CHROMA_CEILING = 0.22

function softChroma(chroma: number): number {
  return CHROMA_CEILING * (1 - Math.exp(-chroma / CHROMA_CEILING))
}

export function jitterColor(rgb: Rgb, random: Random, style: ColorStyle, darkness: number): Rgb {
  const [lightness, chroma, hue] = srgbToOklch(rgb)
  const hueSwing = style.hueJitter * (0.7 + 0.6 * darkness)
  return oklchToSrgb([
    lightness + random.gaussian() * 0.03,
    Math.max(0, chroma * (1 + random.gaussian() * 0.25) + random.next() * 0.02),
    hue + random.gaussian() * hueSwing,
  ])
}

const HUE_BINS = 24

function hueHistogram(image: RgbImage, mask: Field): Float64Array {
  const histogram = new Float64Array(HUE_BINS)
  const pixel = [0, 0, 0]
  for (let p = 0; p < mask.data.length; p += 5) {
    if (mask.data[p] < 0.5) continue
    pixel[0] = image.data[p * 3]
    pixel[1] = image.data[p * 3 + 1]
    pixel[2] = image.data[p * 3 + 2]
    const [lightness, chroma, hue] = srgbToOklch(pixel)
    const bin = Math.floor((((hue / (2 * Math.PI)) % 1) + 1) % 1 * HUE_BINS) % HUE_BINS
    histogram[bin] += chroma * smoothstep(0.12, 0.35, lightness)
  }
  const smoothed = new Float64Array(HUE_BINS)
  for (let b = 0; b < HUE_BINS; b++) {
    smoothed[b] = 0.25 * histogram[(b + HUE_BINS - 1) % HUE_BINS] + 0.5 * histogram[b] + 0.25 * histogram[(b + 1) % HUE_BINS]
  }
  return smoothed
}

function binHue(bin: number): number {
  return ((bin + 0.5) / HUE_BINS) * 2 * Math.PI
}

export function subjectHues(image: RgbImage, mask: Field): [number, number] {
  const histogram = hueHistogram(image, mask)
  let first = 0
  for (let b = 1; b < HUE_BINS; b++) if (histogram[b] > histogram[first]) first = b
  let second = -1
  for (let b = 0; b < HUE_BINS; b++) {
    const separation = Math.min(Math.abs(b - first), HUE_BINS - Math.abs(b - first))
    if (separation < HUE_BINS / 6) continue
    if (second < 0 || histogram[b] > histogram[second]) second = b
  }
  const primary = histogram[first] > 0 ? binHue(first) : WARM_HUE
  const secondary = second >= 0 && histogram[second] > histogram[first] * 0.15 ? binHue(second) : primary + Math.PI
  return [primary, secondary]
}

interface PaletteFamily {
  hue: (hues: [number, number]) => number
  weight: number
  chroma: [number, number]
  lightness: [number, number]
}

const HALO_FAMILIES: PaletteFamily[] = [
  { hue: ([a]) => a + Math.PI, weight: 0.34, chroma: [0.08, 0.16], lightness: [0.32, 0.78] },
  { hue: ([a]) => a + Math.PI - 0.35, weight: 0.18, chroma: [0.06, 0.13], lightness: [0.4, 0.82] },
  { hue: ([a]) => a, weight: 0.14, chroma: [0.1, 0.17], lightness: [0.55, 0.85] },
  { hue: ([, b]) => b, weight: 0.1, chroma: [0.07, 0.15], lightness: [0.35, 0.8] },
  { hue: ([a]) => a + 0.8, weight: 0.06, chroma: [0.09, 0.16], lightness: [0.62, 0.88] },
  { hue: ([a]) => a - 2.6, weight: 0.06, chroma: [0.06, 0.13], lightness: [0.45, 0.8] },
  { hue: ([a]) => a + Math.PI, weight: 0.12, chroma: [0.012, 0.04], lightness: [0.7, 0.9] },
]

export function haloColor(hues: [number, number], random: Random, zone = random.next()): Rgb {
  let roll = (zone + random.gaussian() * 0.12 + 1) % 1
  let family = HALO_FAMILIES[0]
  for (const candidate of HALO_FAMILIES) {
    family = candidate
    roll -= candidate.weight
    if (roll <= 0) break
  }
  const lightness = random.range(family.lightness[0], family.lightness[1])
  const chroma = random.range(family.chroma[0], family.chroma[1])
  return oklchToSrgb([lightness, chroma, family.hue(hues) + random.gaussian() * 0.12])
}

export function mixRgb(a: readonly number[], b: readonly number[], amount: number): Rgb {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount]
}

const SEPARATION = 0.15

export function separatedFrom(color: Rgb, neighbour: Rgb, strength: number): Rgb {
  const [lightness, chroma, hue] = srgbToOklch(color)
  const [neighbourLightness] = srgbToOklch(neighbour)
  const gap = lightness - neighbourLightness
  if (Math.abs(gap) >= SEPARATION || strength <= 0) return color
  const direction = neighbourLightness < 0.55 ? 1 : -1
  const target = neighbourLightness + direction * SEPARATION
  return oklchToSrgb([lightness + (target - lightness) * strength, chroma, hue])
}

export function paletteColor(palette: readonly Rgb[], random: Random, zone = random.next()): Rgb {
  const roll = (zone + random.gaussian() * 0.15 + 1) % 1
  const [lightness, chroma, hue] = srgbToOklch(palette[Math.min(palette.length - 1, Math.floor(roll * palette.length))])
  return oklchToSrgb([lightness + random.gaussian() * 0.04, chroma * random.range(0.85, 1.15), hue + random.gaussian() * 0.05])
}
