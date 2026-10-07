import type { Rgb } from '../color'
import { createRandom, fractalNoise2, valueNoise1, type Random } from '../random'
import { clamp01, createField, sampleFieldBilinear, smoothstep, type Field } from '../raster'
import type { PaintCanvas } from './canvas'
import { haloColor, mixRgb, paletteColor, separatedFrom } from './palette'
import { rasterizeStroke, type KnifeStroke, type StrokeClip } from './stroke'

export interface SubjectGeometry {
  distance: Field
  centerX: number
  centerY: number
  size: number
}

export interface HaloPlan {
  geometry: SubjectGeometry
  baseSize: number
  amount: number
  spread: number
  angle: number
  dryBrush: number
  splatter: number
  hues: [number, number]
  palette: Rgb[]
  canvasColor: Rgb
  subjectColorNear: (x: number, y: number, random: Random) => Rgb
  seed: number
}

interface Position {
  x: number
  y: number
}

function reachOf(plan: HaloPlan): number {
  return plan.spread * plan.geometry.size
}

function directionalWeight(plan: HaloPlan, x: number, y: number): number {
  const dx = x - plan.geometry.centerX
  const dy = y - plan.geometry.centerY
  const below = Math.max(0, dy / (Math.hypot(dx, dy) || 1))
  return 1 - 0.45 * below
}

function clusterWeight(plan: HaloPlan, x: number, y: number): number {
  const scale = plan.geometry.size * 0.22
  return smoothstep(0.36, 0.6, fractalNoise2(x / scale, y / scale, plan.seed + 41, 3))
}

function haloDensity(plan: HaloPlan, x: number, y: number): number {
  const distance = sampleFieldBilinear(plan.geometry.distance, x, y)
  const reach = reachOf(plan)
  if (distance <= 0 || distance > reach) return 0
  const outward = distance / reach
  const falloff = Math.pow(1 - outward, 0.8)
  const breakup = smoothstep(0.12, 0.5, outward)
  const clusters = 1 - breakup + breakup * clusterWeight(plan, x, y)
  return clamp01(falloff * clusters * directionalWeight(plan, x, y))
}

function backgroundColor(plan: HaloPlan, random: Random, zone?: number): Rgb {
  return plan.palette.length > 0 ? paletteColor(plan.palette, random, zone) : haloColor(plan.hues, random, zone)
}

function haloPigment(plan: HaloPlan, x: number, y: number, outward: number, random: Random): Rgb {
  const zoneScale = plan.geometry.size * 0.35
  const zone = fractalNoise2(x / zoneScale, y / zoneScale, plan.seed + 77, 2)
  const borrowed = random.next() < 0.2 * (1 - outward)
  const pigment = borrowed ? plan.subjectColorNear(x, y, random) : backgroundColor(plan, random, zone)
  const nearness = 1 - smoothstep(0.05, SEPARATION_REACH, outward)
  return separatedFrom(pigment, plan.subjectColorNear(x, y, random), nearness)
}

const SEPARATION_REACH = 0.22

function haloStroke(plan: HaloPlan, position: Position, dryness: number, random: Random, scale = 2.6): KnifeStroke {
  const { x, y } = position
  const outward = clamp01(sampleFieldBilinear(plan.geometry.distance, x, y) / reachOf(plan))
  const size = plan.baseSize * scale * Math.exp(random.gaussian() * 0.42)
  const color = mixRgb(haloPigment(plan, x, y, outward, random), plan.canvasColor, dryness * 0.55)
  const vertical = random.next() < 0.12
  return {
    x,
    y,
    angle: vertical ? Math.PI / 2 + random.gaussian() * 0.2 : plan.angle + random.gaussian() * 0.42,
    length: size * random.range(1.0, 1.5) * (1 + dryness * 1.1),
    width: size * random.range(0.5, 1.0),
    color,
    edgeColor: mixRgb(backgroundColor(plan, random), color, 0.4),
    edgeMix: random.next() < 0.4 ? random.range(0.3, 0.7) : 0,
    load: dryness > 0 ? 1.05 - dryness * 0.75 : random.range(1.2, 1.6),
    thickness: random.range(0.7, 1.05) * (1 - dryness * 0.6),
    seed: random.int(1 << 30),
  }
}

function integratedDensity(canvas: PaintCanvas, density: (x: number, y: number) => number): number {
  let total = 0
  const step = 4
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) total += density(x, y)
  }
  return total * step * step
}

function fitsInFrame(canvas: PaintCanvas, stroke: KnifeStroke): boolean {
  const cos = Math.abs(Math.cos(stroke.angle))
  const sin = Math.abs(Math.sin(stroke.angle))
  const halfLength = stroke.length * 0.6
  const halfWidth = stroke.width * 0.9
  const extentX = cos * halfLength + sin * halfWidth
  const extentY = sin * halfLength + cos * halfWidth
  const overhang = Math.max(0, extentX - stroke.x) + Math.max(0, stroke.x + extentX - canvas.width) + Math.max(0, extentY - stroke.y) + Math.max(0, stroke.y + extentY - canvas.height)
  return overhang < stroke.width * 0.35
}

function samplePositions(canvas: PaintCanvas, count: number, random: Random, accept: (x: number, y: number) => number): Position[] {
  const positions: Position[] = []
  let attempts = 0
  while (positions.length < count && attempts < count * 80) {
    attempts++
    const x = random.next() * canvas.width
    const y = random.next() * canvas.height
    if (random.next() < accept(x, y)) positions.push({ x, y })
  }
  return positions
}

const STROKE_AREA_FACTOR = 2.6 * 2.6 * 1.25 * 0.75

function strokeCountFor(canvas: PaintCanvas, plan: HaloPlan, density: (x: number, y: number) => number, coverage: number): number {
  return Math.round((integratedDensity(canvas, density) / (plan.baseSize * plan.baseSize * STROKE_AREA_FACTOR)) * plan.amount * coverage)
}

function innerDensity(plan: HaloPlan): (x: number, y: number) => number {
  const reach = reachOf(plan)
  return (x, y) => haloDensity(plan, x, y) * (1 - smoothstep(0.55, 0.9, sampleFieldBilinear(plan.geometry.distance, x, y) / reach))
}

function solidStrokeCount(canvas: PaintCanvas, plan: HaloPlan): number {
  return strokeCountFor(canvas, plan, innerDensity(plan), 2.2)
}

export function paintHaloBehind(canvas: PaintCanvas, plan: HaloPlan): KnifeStroke[] {
  const random = createRandom(plan.seed + 100)
  const strokes = samplePositions(canvas, solidStrokeCount(canvas, plan), random, innerDensity(plan))
    .map((p) => haloStroke(plan, p, 0, random))
    .filter((stroke) => fitsInFrame(canvas, stroke))
  strokes.sort((a, b) => sampleFieldBilinear(plan.geometry.distance, b.x, b.y) - sampleFieldBilinear(plan.geometry.distance, a.x, a.y))
  for (const stroke of strokes) rasterizeStroke(canvas, stroke)
  return strokes
}

export function paintDryScumbles(canvas: PaintCanvas, plan: HaloPlan): KnifeStroke[] {
  if (plan.dryBrush <= 0) return []
  const random = createRandom(plan.seed + 150)
  const reach = reachOf(plan)
  const outer = (x: number, y: number) => {
    const outward = sampleFieldBilinear(plan.geometry.distance, x, y) / reach
    return outward > 0.25 && outward < 1.05 ? 0.5 * directionalWeight(plan, x, y) * clusterWeight(plan, x, y) : 0
  }
  const count = strokeCountFor(canvas, plan, outer, 1.1 * plan.dryBrush)
  const strokes = samplePositions(canvas, count, random, outer)
    .map((p) => {
      const outward = clamp01(sampleFieldBilinear(plan.geometry.distance, p.x, p.y) / reach)
      return haloStroke(plan, p, clamp01(0.35 + outward * 0.6), random)
    })
    .filter((stroke) => fitsInFrame(canvas, stroke))
  for (const stroke of strokes) rasterizeStroke(canvas, stroke)
  return strokes
}

export function paintHaloMass(canvas: PaintCanvas, plan: HaloPlan): KnifeStroke[] {
  const random = createRandom(plan.seed + 120)
  const reach = reachOf(plan)
  const hugging = (x: number, y: number) => {
    const outward = sampleFieldBilinear(plan.geometry.distance, x, y) / reach
    return outward > 0 && outward < 0.4 ? (1 - outward / 0.4) * directionalWeight(plan, x, y) : 0
  }
  const strokes = samplePositions(canvas, strokeCountFor(canvas, plan, hugging, 1.4 * (2.6 / 1.5) ** 2), random, hugging)
    .map((p) => haloStroke(plan, p, 0, random, 1.5))
    .filter((stroke) => fitsInFrame(canvas, stroke))
  for (const stroke of strokes) rasterizeStroke(canvas, stroke)
  return strokes
}

function outwardAngle(distance: Field, x: number, y: number): number {
  const gx = sampleFieldBilinear(distance, x + 2, y) - sampleFieldBilinear(distance, x - 2, y)
  const gy = sampleFieldBilinear(distance, x, y + 2) - sampleFieldBilinear(distance, x, y - 2)
  return Math.atan2(gy, gx)
}

function protectionClip(canvas: PaintCanvas, isProtected: (x: number, y: number) => boolean): StrokeClip {
  const presence = createField(canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) presence.data[y * canvas.width + x] = isProtected(x, y) ? 0 : 1
  return { presence, threshold: 0.5 }
}

export function paintSilhouetteScrapes(canvas: PaintCanvas, plan: HaloPlan, isProtected: (x: number, y: number) => boolean): KnifeStroke[] {
  const random = createRandom(plan.seed + 250)
  const band = plan.baseSize * 1.5
  const nearEdge = (x: number, y: number) => {
    const distance = sampleFieldBilinear(plan.geometry.distance, x, y)
    return distance > 0.5 && distance < band && !isProtected(x, y) ? 0.5 * directionalWeight(plan, x, y) : 0
  }
  const count = strokeCountFor(canvas, plan, nearEdge, 3)
  const strokes = samplePositions(canvas, count, random, nearEdge).map((p) => {
    const angle = outwardAngle(plan.geometry.distance, p.x, p.y) + random.gaussian() * 0.35
    const length = plan.baseSize * random.range(2.2, 3.6)
    const start = { x: p.x - Math.cos(angle) * length * 0.45, y: p.y - Math.sin(angle) * length * 0.45 }
    const color = plan.subjectColorNear(start.x, start.y, random)
    return {
      x: p.x,
      y: p.y,
      angle,
      length,
      width: plan.baseSize * random.range(0.8, 1.4),
      color,
      edgeColor: color,
      edgeMix: 0,
      load: random.range(0.95, 1.15),
      thickness: random.range(0.6, 0.9),
      seed: random.int(1 << 30),
    }
  })
  const clip = protectionClip(canvas, isProtected)
  for (const stroke of strokes) rasterizeStroke(canvas, stroke, clip)
  return strokes
}

export function paintHaloFront(canvas: PaintCanvas, plan: HaloPlan): KnifeStroke[] {
  const random = createRandom(plan.seed + 200)
  const reach = reachOf(plan)
  const nearEdge = (x: number, y: number) => {
    const distance = sampleFieldBilinear(plan.geometry.distance, x, y)
    return distance > plan.baseSize && distance < reach * 0.2 ? 0.6 * directionalWeight(plan, x, y) : 0
  }
  const count = Math.round(solidStrokeCount(canvas, plan) * 0.1)
  const strokes = samplePositions(canvas, count, random, nearEdge)
    .map((p) => shrinkStroke(haloStroke(plan, p, 0, random), 0.55))
    .filter((stroke) => sampleFieldBilinear(plan.geometry.distance, stroke.x, stroke.y) > stroke.length * 0.4)
  for (const stroke of strokes) rasterizeStroke(canvas, stroke)
  return strokes
}

function shrinkStroke(stroke: KnifeStroke, factor: number): KnifeStroke {
  return { ...stroke, length: stroke.length * factor, width: stroke.width * factor }
}

interface Fleck {
  x: number
  y: number
  radius: number
  stretch: number
  angle: number
}

function fleckRadius(fleck: Fleck, along: number, across: number, seed: number): number {
  const angle = Math.atan2(across, along)
  return fleck.radius * (0.7 + 0.6 * valueNoise1(angle * 1.6 + 10, seed))
}

function paintFleck(canvas: PaintCanvas, fleck: Fleck, color: Rgb, seed: number, isProtected: (x: number, y: number) => boolean): void {
  const reach = Math.ceil(fleck.radius * fleck.stretch + 1)
  const cos = Math.cos(fleck.angle)
  const sin = Math.sin(fleck.angle)
  for (let py = Math.floor(fleck.y - reach); py <= fleck.y + reach; py++) {
    for (let px = Math.floor(fleck.x - reach); px <= fleck.x + reach; px++) {
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue
      const dx = px + 0.5 - fleck.x
      const dy = py + 0.5 - fleck.y
      const along = (dx * cos + dy * sin) / fleck.stretch
      const across = -dx * sin + dy * cos
      const alpha = clamp01(fleckRadius(fleck, along, across, seed) - Math.hypot(along, across) + 0.5)
      if (alpha <= 0 || isProtected(px, py)) continue
      const index = py * canvas.width + px
      for (let c = 0; c < 3; c++) canvas.color.data[index * 3 + c] += (color[c] - canvas.color.data[index * 3 + c]) * alpha
      canvas.thickness.data[index] += alpha * 0.4
    }
  }
}

export interface SplatterPlan {
  amount: number
  baseSize: number
  seed: number
  isProtected: (x: number, y: number) => boolean
}

export function paintSplatter(canvas: PaintCanvas, sources: KnifeStroke[], plan: SplatterPlan): void {
  const random = createRandom(plan.seed + 300)
  const { baseSize } = plan
  for (const stroke of sources) {
    if (random.next() > plan.amount * 0.3) continue
    const heading = stroke.angle + random.gaussian() * 0.6
    const droplets = 1 + random.int(5)
    for (let d = 0; d < droplets; d++) {
      const travel = stroke.length * random.range(0.5, 1.6)
      const spread = random.gaussian() * stroke.width * 0.5
      const fleck: Fleck = {
        x: stroke.x + Math.cos(heading) * travel - Math.sin(heading) * spread,
        y: stroke.y + Math.sin(heading) * travel + Math.cos(heading) * spread,
        radius: Math.max(0.5, baseSize * 0.12 * Math.pow(random.next(), 2.4) * 3),
        stretch: random.range(1, 3.2),
        angle: heading + random.gaussian() * 0.3,
      }
      paintFleck(canvas, fleck, stroke.color, random.int(1 << 20), plan.isProtected)
    }
  }
}

function underlayerStroke(plan: HaloPlan, position: Position, random: Random): KnifeStroke {
  const stroke = { ...haloStroke(plan, position, 0, random, 2.2), load: 1.7 }
  if (sampleFieldBilinear(plan.geometry.distance, position.x, position.y) > 0) return stroke
  const subjectColour = plan.subjectColorNear(position.x, position.y, random)
  return { ...stroke, color: subjectColour, edgeColor: subjectColour, edgeMix: 0 }
}

export function paintUnderlayer(canvas: PaintCanvas, plan: HaloPlan, zone: Field): KnifeStroke[] {
  const random = createRandom(plan.seed + 90)
  const spacing = plan.baseSize * 2.1
  const strokes: KnifeStroke[] = []
  for (let gy = spacing / 2; gy < canvas.height; gy += spacing) {
    for (let gx = spacing / 2; gx < canvas.width; gx += spacing) {
      const position = { x: gx + random.gaussian() * spacing * 0.3, y: gy + random.gaussian() * spacing * 0.3 }
      if (sampleFieldBilinear(zone, position.x, position.y) < 0.5) continue
      const stroke = underlayerStroke(plan, position, random)
      rasterizeStroke(canvas, stroke)
      strokes.push(stroke)
    }
  }
  return strokes
}
