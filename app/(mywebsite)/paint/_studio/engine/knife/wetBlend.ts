import type { Rgb } from '../color'
import { createRandom, type Random } from '../random'
import { sampleFieldBilinear, sampleImageBilinear, smoothstep, type Field } from '../raster'
import type { PaintCanvas } from './canvas'
import { rasterizeStroke, type KnifeStroke } from './stroke'

export interface WetBlendPlan {
  distance: Field
  reach: number
  amount: number
  angle: number
  dragLength: number
  seed: number
}

export function wetBlendWeight(plan: WetBlendPlan, distance: number): number {
  if (distance <= 0) return 0
  const outward = distance / plan.reach
  return plan.amount * smoothstep(0, 0.04, outward) * (1 - smoothstep(0.15, 0.55, outward))
}

export interface WetMergePlan extends WetBlendPlan {
  baseSize: number
}

function localAverage(canvas: PaintCanvas, x: number, y: number, radius: number, out: Rgb): void {
  out[0] = out[1] = out[2] = 0
  const sample = new Float32Array(3)
  let total = 0
  for (const [dx, dy] of MERGE_TAPS) {
    const weight = 1e-3 + sampleFieldBilinear(canvas.paint, x + dx * radius, y + dy * radius)
    sampleImageBilinear(canvas.color, x + dx * radius, y + dy * radius, sample)
    for (let c = 0; c < 3; c++) out[c] += sample[c] * weight
    total += weight
  }
  for (let c = 0; c < 3; c++) out[c] /= total
}

const MERGE_TAPS: [number, number][] = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7]]

function mergeStroke(canvas: PaintCanvas, plan: WetMergePlan, x: number, y: number, random: Random): KnifeStroke {
  const size = plan.baseSize * random.range(2.2, 3.6)
  const angle = plan.angle + random.gaussian() * 0.5
  const color: Rgb = [0, 0, 0]
  const neighbour: Rgb = [0, 0, 0]
  localAverage(canvas, x, y, size * 0.5, color)
  localAverage(canvas, x + Math.cos(angle + 1.6) * size * 0.6, y + Math.sin(angle + 1.6) * size * 0.6, size * 0.3, neighbour)
  return {
    x,
    y,
    angle,
    length: size * random.range(1.2, 1.9),
    width: size * random.range(0.6, 1.0),
    color,
    edgeColor: neighbour,
    edgeMix: random.range(0.4, 0.9),
    load: random.range(1.2, 1.5),
    thickness: random.range(0.4, 0.7),
    seed: random.int(1 << 30),
    wetMix: random.range(0.25, 0.45),
  }
}

export function paintWetMerges(canvas: PaintCanvas, plan: WetMergePlan): KnifeStroke[] {
  if (plan.amount <= 0) return []
  const random = createRandom(plan.seed + 640)
  const spacing = plan.baseSize * 1.6
  const strokes: KnifeStroke[] = []
  for (let gy = 0; gy < canvas.height; gy += spacing) {
    for (let gx = 0; gx < canvas.width; gx += spacing) {
      const x = gx + random.next() * spacing
      const y = gy + random.next() * spacing
      const weight = wetBlendWeight(plan, sampleFieldBilinear(plan.distance, x, y))
      if (random.next() > weight) continue
      const stroke = mergeStroke(canvas, plan, x, y, random)
      rasterizeStroke(canvas, stroke)
      strokes.push(stroke)
    }
  }
  return strokes
}
