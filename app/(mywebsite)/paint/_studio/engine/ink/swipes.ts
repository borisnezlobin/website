import { createRandom, valueNoise1, type Random } from '../random'
import type { Field } from '../raster'
import type { BladePoint, BladeStroke } from './blade'

export interface SwipeSettings {
  amount: number
  angle: number
  protect: Field | null
  charge?: number
  length: number
  width: number
  pressure: number
  drag: number
  seed: number
}

const SWIPES_AT_FULL_AMOUNT = 9

const SAMPLE_STRIDE = 3

interface InkDistribution {
  positions: Int32Array
  cumulative: Float64Array
}

const EDGE_PROBE = 4
const INK_PRESENT = 0.25

interface Direction {
  dx: number
  dy: number
}

function valueAt(field: Field, x: number, y: number): number {
  const px = Math.round(x)
  const py = Math.round(y)
  if (px < 0 || py < 0 || px >= field.width || py >= field.height) return 0
  return field.data[py * field.width + px]
}

const CLEARANCE_FRACTION = 0.035

function openSpaceAhead(load: Field, x: number, y: number, direction: Direction, here: number): boolean {
  const clearance = Math.max(EDGE_PROBE * 2, Math.max(load.width, load.height) * CLEARANCE_FRACTION)
  for (const distance of [1, 2, EDGE_PROBE, clearance * 0.5, clearance]) {
    if (valueAt(load, x + direction.dx * distance, y + direction.dy * distance) >= here * 0.3) return false
  }
  return true
}

const MIN_FACING = 0.6

function facing(load: Field, x: number, y: number, direction: Direction): number {
  const gx = valueAt(load, x + 2, y) - valueAt(load, x - 2, y)
  const gy = valueAt(load, x, y + 2) - valueAt(load, x, y - 2)
  const magnitude = Math.hypot(gx, gy)
  if (magnitude < 1e-6) return 1
  return -(gx * direction.dx + gy * direction.dy) / magnitude
}

function trailingEdgeWeight(load: Field, protect: Field | null, x: number, y: number, direction: Direction): number {
  const here = load.data[y * load.width + x]
  if (here <= INK_PRESENT) return 0
  if (protect && valueAt(protect, x, y) > 0) return 0
  if (!openSpaceAhead(load, x, y, direction, here)) return 0
  const squareness = facing(load, x, y, direction)
  return squareness >= MIN_FACING ? here * squareness * squareness : 0
}

function strongestEdgeInBlock(load: Field, protect: Field | null, x0: number, y0: number, direction: Direction): { index: number; value: number } {
  let index = y0 * load.width + x0
  let value = 0
  for (let y = y0; y < Math.min(load.height, y0 + SAMPLE_STRIDE); y++) {
    for (let x = x0; x < Math.min(load.width, x0 + SAMPLE_STRIDE); x++) {
      const candidate = trailingEdgeWeight(load, protect, x, y, direction)
      if (candidate <= value) continue
      value = candidate
      index = y * load.width + x
    }
  }
  return { index, value }
}

function edgeDistribution(load: Field, protect: Field | null, direction: Direction): InkDistribution | null {
  const positions: number[] = []
  const cumulative: number[] = []
  let total = 0
  for (let y = 0; y < load.height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < load.width; x += SAMPLE_STRIDE) {
      const edge = strongestEdgeInBlock(load, protect, x, y, direction)
      if (edge.value <= 0) continue
      total += edge.value
      positions.push(edge.index)
      cumulative.push(total)
    }
  }
  if (total <= 0) return null
  return { positions: Int32Array.from(positions), cumulative: Float64Array.from(cumulative) }
}

function hitsProtected(protect: Field, point: BladePoint, normal: Direction, halfWidth: number, threshold = 0): boolean {
  for (const t of [-1, -0.5, 0, 0.5, 1]) {
    if (valueAt(protect, point.x + normal.dx * halfWidth * t, point.y + normal.dy * halfWidth * t) > threshold) return true
  }
  return false
}

function stopBeforeProtected(path: BladePoint[], protect: Field | null, width: number, startIndex: number): BladePoint[] {
  if (!protect) return path
  for (let i = Math.max(1, startIndex); i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    const length = Math.hypot(dx, dy) || 1
    if (hitsProtected(protect, path[i], { dx: -dy / length, dy: dx / length }, width / 2)) return path.slice(0, Math.max(2, i - 1))
  }
  return path
}

const SHAPE_PROBE_STEP = 2
const LOOK_AHEAD = 3

const SUBSTANTIAL_PROBES = 3

function probesOnInk(load: Field, point: BladePoint, normal: Direction, halfWidth: number): number {
  let count = 0
  for (const t of [-1, -0.5, 0, 0.5, 1]) {
    if (valueAt(load, point.x + normal.dx * halfWidth * t, point.y + normal.dy * halfWidth * t) > INK_PRESENT) count++
  }
  return count
}

function nextShapeDistance(load: Field, path: BladePoint[], width: number): number | null {
  const total = pathLength(path)
  let leftShape = false
  for (let distance = 0; distance <= total; distance += SHAPE_PROBE_STEP) {
    const at = pointAlong(path, distance)
    if (!at) return null
    const ahead = { x: at.point.x + at.normal.dy * LOOK_AHEAD, y: at.point.y - at.normal.dx * LOOK_AHEAD }
    const touching = probesOnInk(load, ahead, at.normal, width / 2) >= SUBSTANTIAL_PROBES
    if (!touching) leftShape = true
    else if (leftShape) return distance
  }
  return null
}

function truncate(path: BladePoint[], distance: number): BladePoint[] {
  const kept: BladePoint[] = [path[0]]
  let travelled = 0
  for (let i = 1; i < path.length; i++) {
    const segment = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    if (travelled + segment >= distance) break
    kept.push(path[i])
    travelled += segment
  }
  const end = pointAlong(path, distance)
  if (end) kept.push(end.point)
  return kept.length >= 2 ? kept : path.slice(0, 2)
}

function stopBeforeNextShape(path: BladePoint[], load: Field, width: number): BladePoint[] {
  const hit = nextShapeDistance(load, path, width)
  return hit === null ? path : truncate(path, Math.max(SHAPE_PROBE_STEP, hit - width * 0.5 - SHAPE_PROBE_STEP))
}

function inkWeightedStart(distribution: InkDistribution, width: number, random: Random): BladePoint {
  const { cumulative, positions } = distribution
  const target = random.next() * cumulative[cumulative.length - 1]
  let low = 0
  let high = cumulative.length - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (cumulative[middle] < target) low = middle + 1
    else high = middle
  }
  const index = positions[low]
  return { x: index % width, y: Math.floor(index / width) }
}

function throughAnchor(path: BladePoint[], anchor: BladePoint, lead: number): BladePoint[] {
  let travelled = 0
  for (let i = 1; i < path.length; i++) {
    const segment = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    if (travelled + segment >= lead) {
      const t = (lead - travelled) / segment
      const dx = anchor.x - (path[i - 1].x + (path[i].x - path[i - 1].x) * t)
      const dy = anchor.y - (path[i - 1].y + (path[i].y - path[i - 1].y) * t)
      return path.map((point) => ({ x: point.x + dx, y: point.y + dy }))
    }
    travelled += segment
  }
  return path
}

function curvedPath(start: BladePoint, angle: number, length: number, seed: number): BladePoint[] {
  const points: BladePoint[] = [start]
  const segments = Math.max(4, Math.ceil(length / 12))
  let { x, y } = start
  for (let s = 1; s <= segments; s++) {
    const heading = angle + (valueNoise1(s / 6, seed) - 0.5) * 0.35
    x += (Math.cos(heading) * length) / segments
    y += (Math.sin(heading) * length) / segments
    points.push({ x, y })
  }
  return points
}

const LANDING_INSET = 0
const EDGE_LANDING_RAMP = 1
const SLANT_ALLOWANCE = 0.7
const MIN_TRAIL_FRACTION = 0.4
const ATTEMPTS_PER_SWIPE = 5
const OFFSET_SAMPLES_SPACING = 2

function pointAlong(path: BladePoint[], distance: number): { point: BladePoint; normal: Direction } | null {
  let travelled = 0
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    const segment = Math.hypot(dx, dy)
    if (travelled + segment >= distance) {
      const t = (distance - travelled) / segment
      return { point: { x: path[i - 1].x + dx * t, y: path[i - 1].y + dy * t }, normal: { dx: -dy / segment, dy: dx / segment } }
    }
    travelled += segment
  }
  return null
}

function pathLength(path: BladePoint[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
  return total
}

function edgeCrossing(load: Field, path: BladePoint[], offset: number, direction: Direction, total: number): number {
  for (let distance = 0; distance <= total; distance += 1) {
    const at = pointAlong(path, distance)
    if (!at) break
    const x = Math.round(at.point.x + at.normal.dx * offset)
    const y = Math.round(at.point.y + at.normal.dy * offset)
    if (x < 0 || y < 0 || x >= load.width || y >= load.height) continue
    const here = load.data[y * load.width + x]
    if (here > INK_PRESENT && openSpaceAhead(load, x, y, direction, here)) return distance
  }
  return Infinity
}

const NEIGHBOUR_REACH = 2

function borrowFromNeighbours(landings: Float32Array, reach: number): void {
  const original = landings.slice()
  for (let n = 0; n < landings.length; n++) {
    if (Number.isFinite(original[n])) continue
    for (let d = 1; d <= reach && !Number.isFinite(landings[n]); d++) {
      const nearest = Math.min(original[Math.max(0, n - d)], original[Math.min(landings.length - 1, n + d)])
      if (Number.isFinite(nearest)) landings[n] = nearest
    }
  }
}

function edgeLanding(load: Field, path: BladePoint[], width: number, direction: Direction): (offset: number) => number {
  const total = pathLength(path)
  const count = 2 * Math.max(1, Math.ceil(width / (2 * OFFSET_SAMPLES_SPACING))) + 1
  const landings = new Float32Array(count)
  for (let n = 0; n < count; n++) {
    const offset = (n / (count - 1) - 0.5) * width
    landings[n] = Math.max(0, edgeCrossing(load, path, offset, direction, total) - EDGE_LANDING_RAMP - LANDING_INSET)
  }
  borrowFromNeighbours(landings, NEIGHBOUR_REACH)
  return (offset) => landings[Math.min(count - 1, Math.max(0, Math.round((offset / width + 0.5) * (count - 1))))]
}

interface SwipeShape {
  anchor: BladePoint
  length: number
  width: number
  angle: number
}

function buildSwipe(load: Field, settings: SwipeSettings, shape: SwipeShape, random: Random): BladeStroke | null {
  const { anchor, length, width, angle } = shape
  const lead = EDGE_LANDING_RAMP + LANDING_INSET + width * SLANT_ALLOWANCE + random.range(1, 3)
  const start = { x: anchor.x - Math.cos(angle) * lead, y: anchor.y - Math.sin(angle) * lead }
  const path = throughAnchor(curvedPath(start, angle, length, random.int(1 << 20)), anchor, lead)
  const clipped = stopBeforeNextShape(stopBeforeProtected(path, settings.protect, width, 1), load, width)
  const trail = pathLength(clipped) - lead
  if (trail < Math.max(MIN_TRAIL_FRACTION * length, 2 * width)) return null
  return {
    path: clipped,
    landing: edgeLanding(load, clipped, width, { dx: Math.cos(settings.angle), dy: Math.sin(settings.angle) }),
    landingRamp: EDGE_LANDING_RAMP,
    charge: settings.charge ?? 0,
    width,
    clearance: 0,
    dragLength: 0,
    seed: random.int(1 << 20),
  }
}

export function generateSwipes(load: Field, settings: SwipeSettings, scale: number, inkScale: number): BladeStroke[] {
  if (settings.amount <= 0 || settings.length <= 0) return []
  const distribution = edgeDistribution(load, settings.protect, { dx: Math.cos(settings.angle), dy: Math.sin(settings.angle) })
  if (!distribution) return []
  const random = createRandom(settings.seed + 900)
  const count = Math.max(1, Math.round(settings.amount * SWIPES_AT_FULL_AMOUNT))
  const strokes: BladeStroke[] = []
  for (let attempt = 0; attempt < count * ATTEMPTS_PER_SWIPE && strokes.length < count; attempt++) {
    const shape: SwipeShape = {
      anchor: inkWeightedStart(distribution, load.width, random),
      length: settings.length * scale * random.range(0.6, 1.35),
      width: settings.width * scale * random.range(0.55, 1.45),
      angle: settings.angle + random.gaussian() * 0.1,
    }
    const swipe = buildSwipe(load, settings, shape, random)
    if (!swipe) continue
    swipe.clearance = inkScale * (1 - settings.pressure) * random.range(0.6, 1.4)
    swipe.dragLength = settings.drag * scale * random.range(0.6, 1.4)
    strokes.push(swipe)
  }
  return strokes
}
