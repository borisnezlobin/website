import { createField, type Field } from '../raster'
import type { PaintCanvas } from './canvas'

const FULLY_PAINTED = 0.98
const SEARCH_RADII = [2, 6, 18, 54, 160]
const SAMPLES_PER_RING = 16
const ENOUGH_PAINT = 0.5
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function nearSubjectZone(distance: Field, band: number): Field {
  const zone = createField(distance.width, distance.height)
  for (let i = 0; i < zone.data.length; i++) zone.data[i] = distance.data[i] <= band ? 1 : 0
  return zone
}

function bareInside(canvas: PaintCanvas, zone: Field): number[] {
  const bare: number[] = []
  for (let i = 0; i < zone.data.length; i++) if (zone.data[i] > 0 && canvas.paint.data[i] < FULLY_PAINTED) bare.push(i)
  return bare
}

function addPaintedSample(canvas: PaintCanvas, x: number, y: number, total: Float64Array): void {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return
  const index = Math.floor(y) * canvas.width + Math.floor(x)
  const weight = canvas.paint.data[index]
  if (weight < FULLY_PAINTED) return
  for (let c = 0; c < 3; c++) total[c] += canvas.color.data[index * 3 + c] * weight
  total[3] += weight
}

function paintAround(canvas: PaintCanvas, index: number, radius: number, total: Float64Array): void {
  const x = index % canvas.width
  const y = (index - x) / canvas.width
  total.fill(0)
  for (let n = 1; n <= SAMPLES_PER_RING; n++) {
    const distance = radius * Math.sqrt(n / SAMPLES_PER_RING)
    const angle = n * GOLDEN_ANGLE
    addPaintedSample(canvas, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, total)
  }
}

function fillPixel(canvas: PaintCanvas, index: number, total: Float64Array): void {
  for (const radius of SEARCH_RADII) {
    paintAround(canvas, index, radius, total)
    if (total[3] < ENOUGH_PAINT) continue
    const missing = 1 - canvas.paint.data[index]
    for (let c = 0; c < 3; c++) canvas.color.data[index * 3 + c] += (total[c] / total[3] - canvas.color.data[index * 3 + c]) * missing
    return
  }
}

export function coverBarePaper(canvas: PaintCanvas, zone: Field): number {
  const bare = bareInside(canvas, zone)
  const total = new Float64Array(4)
  for (const index of bare) fillPixel(canvas, index, total)
  for (const index of bare) canvas.paint.data[index] = 1
  return bare.length
}
