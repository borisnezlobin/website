export type Rgb = [number, number, number]

const CURVE_STEPS = 4096

function exactSrgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
}

function exactLinearToSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055
}

function tabulate(curve: (value: number) => number): Float64Array {
  const table = new Float64Array(CURVE_STEPS + 2)
  for (let i = 0; i <= CURVE_STEPS + 1; i++) table[i] = curve(Math.min(1, i / CURVE_STEPS))
  return table
}

const TO_LINEAR = tabulate(exactSrgbToLinear)
const TO_SRGB = tabulate(exactLinearToSrgb)

function lookUp(table: Float64Array, value: number): number {
  const position = value * CURVE_STEPS
  const index = Math.floor(position)
  const fraction = position - index
  return table[index] + (table[index + 1] - table[index]) * fraction
}

export function srgbToLinear(value: number): number {
  if (value <= 0.04045 || value > 1) return exactSrgbToLinear(value)
  return lookUp(TO_LINEAR, value)
}

export function linearToSrgb(value: number): number {
  const clamped = value < 0 ? 0 : value > 1 ? 1 : value
  if (clamped <= 0.0031308) return clamped * 12.92
  return lookUp(TO_SRGB, clamped)
}

export function srgbToOklab(rgb: readonly number[]): Rgb {
  const r = srgbToLinear(rgb[0])
  const g = srgbToLinear(rgb[1])
  const b = srgbToLinear(rgb[2])
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToSrgb(lab: readonly number[]): Rgb {
  const lRoot = lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2]
  const mRoot = lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2]
  const sRoot = lab[0] - 0.0894841775 * lab[1] - 1.291485548 * lab[2]
  const l = lRoot * lRoot * lRoot
  const m = mRoot * mRoot * mRoot
  const s = sRoot * sRoot * sRoot
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

export function oklabToOklch(lab: readonly number[]): Rgb {
  return [lab[0], Math.hypot(lab[1], lab[2]), Math.atan2(lab[2], lab[1])]
}

export function oklchToOklab(lch: readonly number[]): Rgb {
  return [lch[0], lch[1] * Math.cos(lch[2]), lch[1] * Math.sin(lch[2])]
}

export function srgbToOklch(rgb: readonly number[]): Rgb {
  return oklabToOklch(srgbToOklab(rgb))
}

export function oklchToSrgb(lch: readonly number[]): Rgb {
  return oklabToSrgb(oklchToOklab(lch))
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const value = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

export function rgbToHex(rgb: readonly number[]): string {
  const toByte = (v: number) => Math.round(Math.min(Math.max(v, 0), 1) * 255)
  return '#' + rgb.map((v) => toByte(v).toString(16).padStart(2, '0')).join('')
}
