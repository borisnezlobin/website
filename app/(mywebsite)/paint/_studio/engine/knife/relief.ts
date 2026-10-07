import { gaussianBlurField } from '../filters'
import type { PaintCanvas } from './canvas'

const LIGHT = normalize([-0.45, -0.65, 0.62])
const HALF_VECTOR = normalize([LIGHT[0], LIGHT[1], LIGHT[2] + 1])

function normalize(v: number[]): number[] {
  const length = Math.hypot(v[0], v[1], v[2])
  return [v[0] / length, v[1] / length, v[2] / length]
}

export function applyRelief(canvas: PaintCanvas, strength: number, scale: number): void {
  if (strength <= 0) return
  const height = gaussianBlurField(canvas.thickness, 0.8)
  const { width } = canvas
  const steepness = 0.9 * Math.min(2, scale / 1000)
  const flatShade = LIGHT[2]
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      if (canvas.paint.data[i] <= 0.01 && height.data[i] <= 0.01) continue
      const gx = (height.data[i + 1] - height.data[i - 1]) * 0.5 * steepness
      const gy = (height.data[i + width] - height.data[i - width]) * 0.5 * steepness
      const norm = Math.hypot(gx, gy, 1)
      const nx = -gx / norm
      const ny = -gy / norm
      const nz = 1 / norm
      const diffuse = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / flatShade
      const specular = Math.pow(Math.max(0, nx * HALF_VECTOR[0] + ny * HALF_VECTOR[1] + nz * HALF_VECTOR[2]), 60)
      const shade = 1 + strength * 0.55 * (diffuse - 1)
      const gloss = strength * 0.35 * specular * Math.min(1, Math.hypot(gx, gy) * 3)
      for (let c = 0; c < 3; c++) {
        const value = canvas.color.data[i * 3 + c] * shade + gloss
        canvas.color.data[i * 3 + c] = value < 0 ? 0 : value > 1 ? 1 : value
      }
    }
  }
}
