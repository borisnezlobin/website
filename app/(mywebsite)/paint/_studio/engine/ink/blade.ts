import { valueNoise1, valueNoise2 } from '../random'
import type { Field } from '../raster'

export interface BladePoint {
  x: number
  y: number
}

export interface BladeStroke {
  path: BladePoint[]
  width: number
  clearance: number
  dragLength: number
  seed: number
  landing?: (offset: number) => number
  landingRamp?: number
  charge?: number
}

export interface BladeTexture {
  streaks: number
  chatter: number
}

export interface BladeLayers {
  wet: Field[]
  paintLayers: number
  set: Field[]
  setInto: number[]
  looseness: number
  protect?: Field | null
  chargeable?: number
  reserveFrom?: number
}

const STEP = 0.5
const SAMPLE_SPACING = 0.7
const ALONG_BLADE_FLOW = 0.04
const EDGE_LEAK = 0.012
const RELEASE_DEPOSIT = 0.05
const LAND_RAMP = 0.06
const LIFT_RAMP = 0.18

interface Blade {
  offsets: Float32Array
  nicks: Float32Array
  edgeLift: Float32Array
  landAt: Float32Array
  liftAt: Float32Array
  lastX: Float32Array
  lastY: Float32Array
  charged: Uint8Array
  landedAt: Float32Array
  tone: Float64Array[]
  bead: Float64Array[]
}

function nickProfile(offset: number, seed: number, streaks: number): number {
  const fine = valueNoise1(offset / 2.3 + 0.37, seed)
  const medium = valueNoise1(offset / 6.1 + 0.71, seed + 11)
  const coarse = valueNoise1(offset / 19.7 + 0.13, seed + 23)
  const scratch = 0.4 * fine + 0.35 * medium + 0.25 * coarse
  return Math.max(0.05, 1 + streaks * (2.4 * scratch - 1.2))
}

function edgeFalloff(offset: number, halfWidth: number, seed: number): number {
  const ragged = 0.8 + 0.4 * valueNoise1(offset / 7 + 3.3, seed + 41)
  const reach = Math.abs(offset) / (halfWidth * ragged)
  return 1 + 25 * Math.pow(Math.min(1.2, reach), 6)
}

function correlatedNoise(offset: number, width: number, seed: number): number {
  const broad = valueNoise1(offset / (width * 0.35) + 2.1, seed)
  const local = valueNoise1(offset / 5.3 + 0.7, seed + 7)
  return 0.8 * broad + 0.2 * local
}

const LANDING_IN_BLADE_WIDTHS = 0.3
const LANDING_RAMP_IN_BLADE_WIDTHS = 0.2

function contactWindow(offset: number, width: number, travel: number, seed: number): [number, number] {
  const land = Math.min(travel * 0.1, width * LANDING_IN_BLADE_WIDTHS) * correlatedNoise(offset, width, seed + 53)
  const lift = travel * (1 - LIFT_RAMP - 0.25 * correlatedNoise(offset, width, seed + 59))
  return [land, lift]
}

function makeBlade(stroke: BladeStroke, layerCount: number, texture: BladeTexture, travel: number): Blade {
  const count = Math.max(2, Math.ceil(stroke.width / SAMPLE_SPACING))
  const blade: Blade = {
    offsets: new Float32Array(count),
    nicks: new Float32Array(count),
    edgeLift: new Float32Array(count),
    landAt: new Float32Array(count),
    liftAt: new Float32Array(count),
    lastX: new Float32Array(count).fill(Number.NaN),
    lastY: new Float32Array(count).fill(Number.NaN),
    charged: new Uint8Array(count),
    landedAt: new Float32Array(count),
    tone: Array.from({ length: count }, () => new Float64Array(layerCount)),
    bead: Array.from({ length: count }, () => new Float64Array(layerCount)),
  }
  for (let k = 0; k < count; k++) {
    const offset = (k / (count - 1) - 0.5) * stroke.width
    blade.offsets[k] = offset
    blade.nicks[k] = nickProfile(offset, stroke.seed, texture.streaks)
    blade.edgeLift[k] = edgeFalloff(offset, stroke.width / 2, stroke.seed)
    ;[blade.landAt[k], blade.liftAt[k]] = contactWindow(offset, stroke.width, travel, stroke.seed)
    if (stroke.landing) blade.landAt[k] = stroke.landing(offset)
  }
  return blade
}

function resample(path: BladePoint[]): BladePoint[] {
  const result: BladePoint[] = [path[0]]
  let carry = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const segment = Math.hypot(b.x - a.x, b.y - a.y)
    let t = STEP - carry
    while (t <= segment) {
      result.push({ x: a.x + ((b.x - a.x) * t) / segment, y: a.y + ((b.y - a.y) * t) / segment })
      t += STEP
    }
    carry = segment - (t - STEP)
  }
  return result
}

function paintLoad(layers: BladeLayers, index: number): number {
  let load = 0
  for (let l = 0; l < layers.paintLayers; l++) load += Math.max(0, layers.wet[l].data[index])
  for (const field of layers.set) load += Math.max(0, field.data[index]) * layers.looseness
  return load
}

function scrape(layers: BladeLayers, index: number, gap: number, bead: Float64Array, weight: number): void {
  const load = paintLoad(layers, index)
  if (load <= gap || load <= 1e-9) return
  const fraction = ((load - gap) / load) * weight
  for (let l = 0; l < layers.wet.length; l++) {
    const take = Math.max(0, layers.wet[l].data[index]) * fraction
    layers.wet[l].data[index] -= take
    bead[l] += take
  }
  layers.set.forEach((field, c) => {
    const take = Math.max(0, field.data[index]) * layers.looseness * fraction
    field.data[index] -= take
    bead[layers.setInto[c]] += take
  })
}

interface Footprint {
  indices: number[]
  weights: number[]
}

function footprint(field: Field, x: number, y: number, protect?: Field | null): Footprint {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const candidates: [number, number, number][] = [
    [x0, y0, (1 - fx) * (1 - fy)],
    [x0 + 1, y0, fx * (1 - fy)],
    [x0, y0 + 1, (1 - fx) * fy],
    [x0 + 1, y0 + 1, fx * fy],
  ]
  const result: Footprint = { indices: [], weights: [] }
  let total = 0
  for (const [cx, cy, w] of candidates) {
    if (w <= 0 || cx < 0 || cy < 0 || cx >= field.width || cy >= field.height) continue
    if (protect && protect.data[cy * field.width + cx] > 0) continue
    result.indices.push(cy * field.width + cx)
    result.weights.push(w)
    total += w
  }
  for (let i = 0; i < result.weights.length; i++) result.weights[i] /= total
  return result
}

function depositInto(layers: BladeLayers, place: Footprint, bead: Float64Array, fraction: number): void {
  if (place.indices.length === 0) return
  for (let l = 0; l < bead.length; l++) {
    const amount = bead[l] * fraction
    if (amount === 0) continue
    bead[l] -= amount
    for (let n = 0; n < place.indices.length; n++) layers.wet[l].data[place.indices[n]] += amount * place.weights[n]
  }
}

function flowAlongBlade(blade: Blade, snapshot: Float64Array): void {
  const count = blade.bead.length
  const layerCount = blade.bead[0].length
  for (let l = 0; l < layerCount; l++) {
    for (let k = 0; k < count; k++) snapshot[k] = blade.bead[k][l]
    for (let k = 0; k + 1 < count; k++) {
      const exchange = ALONG_BLADE_FLOW * (snapshot[k] - snapshot[k + 1])
      blade.bead[k][l] -= exchange
      blade.bead[k + 1][l] += exchange
    }
  }
}

interface BladeFrame {
  x: number
  y: number
  normalX: number
  normalY: number
}

function frameAt(points: BladePoint[], i: number): BladeFrame {
  const a = points[Math.max(0, i - 2)]
  const b = points[Math.min(points.length - 1, i + 2)]
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: points[i].x, y: points[i].y, normalX: -(b.y - a.y) / length, normalY: (b.x - a.x) / length }
}

interface SweepState {
  frame: BladeFrame
  travelled: number
  travel: number
  landingRamp: number
}

function beadPaint(bead: Float64Array, paintLayers: number): number {
  let total = 0
  for (let l = 0; l < paintLayers; l++) total += bead[l]
  return total
}

function filmRate(stroke: BladeStroke, bead: Float64Array, paintLayers: number): number {
  const fullness = beadPaint(bead, paintLayers) / Math.max(1e-6, stroke.clearance * stroke.dragLength * 0.5)
  return 1 - Math.exp((-STEP / Math.max(1, stroke.dragLength)) * (1 + Math.min(1, Math.sqrt(Math.max(0, fullness)))))
}

function rampUp(value: number, start: number, length: number): number {
  const t = Math.min(1, Math.max(0, (value - start) / Math.max(length, 1e-6)))
  return t * t * (3 - 2 * t)
}

function pressureAt(blade: Blade, k: number, sweep: SweepState): number {
  const landing = rampUp(sweep.travelled, blade.landAt[k], sweep.landingRamp)
  const lifting = 1 - rampUp(sweep.travelled, blade.liftAt[k], sweep.travel * LIFT_RAMP)
  return landing * lifting
}

function chatterAt(texture: BladeTexture, stroke: BladeStroke, offset: number, travelled: number): number {
  if (texture.chatter <= 0) return 1
  const tilt = offset / (stroke.width * 1.5)
  const judder = 0.6 * valueNoise2(travelled / 9.3 + tilt, offset / 40, stroke.seed + 5) + 0.4 * valueNoise2(travelled / 3.1, offset / 15, stroke.seed + 9)
  return 1 + texture.chatter * Math.max(0, judder - 0.6) * 10
}

function wear(offset: number, travelled: number, stroke: BladeStroke): number {
  return 0.75 + 0.5 * valueNoise2(offset / 8, travelled / 60, stroke.seed + 71)
}

const CHARGE_CONTACT = 0.5
const CHARGE_TO_EDGE_DENSITY = 0.25

const RESERVE_CHARGE_BOOST = 2

function chargeWeight(layers: BladeLayers, layer: number): number {
  return layers.reserveFrom !== undefined && layer >= layers.reserveFrom ? RESERVE_CHARGE_BOOST : 1
}

function chargeFrom(layers: BladeLayers, place: Footprint, bead: Float64Array, amount: number): void {
  const chargeable = layers.chargeable ?? layers.paintLayers
  place.indices.forEach((index, n) => {
    const weight = place.weights[n] * amount
    for (let l = 0; l < chargeable; l++) bead[l] += Math.max(0, layers.wet[l].data[index]) * weight * chargeWeight(layers, l)
    layers.set.forEach((field, c) => {
      const into = layers.setInto[c]
      if (into < chargeable) bead[into] += Math.max(0, field.data[index]) * layers.looseness * weight * chargeWeight(layers, into)
    })
  })
}

const CHARGE_LOOK_BACK = 6

function inkAt(layers: BladeLayers, place: Footprint): number {
  let total = 0
  place.indices.forEach((index, n) => {
    total += paintLoad(layers, index) * place.weights[n]
  })
  return total
}

function richestPlaceBehind(layers: BladeLayers, x: number, y: number, frame: BladeFrame): Footprint {
  const backX = frame.normalY
  const backY = -frame.normalX
  let best = footprint(layers.wet[0], x, y, layers.protect)
  let bestInk = inkAt(layers, best)
  for (let d = 1; d <= CHARGE_LOOK_BACK; d++) {
    const place = footprint(layers.wet[0], x - backX * d, y - backY * d, layers.protect)
    const ink = inkAt(layers, place)
    if (ink > bestInk) {
      best = place
      bestInk = ink
    }
  }
  return best
}

interface Landing {
  x: number
  y: number
  frame: BladeFrame
  pressure: number
  travelled: number
}

function chargeOnLanding(layers: BladeLayers, blade: Blade, stroke: BladeStroke, k: number, landing: Landing): void {
  if (!stroke.charge || blade.charged[k] || landing.pressure < CHARGE_CONTACT) return
  blade.charged[k] = 1
  blade.landedAt[k] = landing.travelled
  const place = richestPlaceBehind(layers, landing.x, landing.y, landing.frame)
  chargeFrom(layers, place, blade.tone[k], 1 / Math.max(layers.looseness, 1e-3))
  chargeFrom(layers, place, blade.bead[k], stroke.charge * stroke.dragLength * CHARGE_TO_EDGE_DENSITY)
}

const EDGE_COPY_SHARE = 0.45
const BARE_PAPER_LOAD = 0.15

function continueEdgeTone(layers: BladeLayers, blade: Blade, k: number, place: Footprint, travelled: number, dragLength: number): void {
  const since = travelled - blade.landedAt[k]
  const length = Math.max(4, dragLength * EDGE_COPY_SHARE)
  if (!blade.charged[k] || since < 0 || since > length) return
  const t = since / length
  const strength = 1 - t * t * (3 - 2 * t)
  const chargeable = layers.chargeable ?? layers.paintLayers
  const bare = place.indices.map((index) => paintLoad(layers, index) < BARE_PAPER_LOAD)
  for (let l = 0; l < chargeable; l++) {
    const target = settledLayerFor(layers, l)
    place.indices.forEach((index, n) => {
      if (!bare[n]) return
      const present = layers.wet[l].data[index] + (target ? target.data[index] : 0)
      const missing = (blade.tone[k][l] / chargeWeight(layers, l)) * strength - present
      const give = Math.min(Math.max(0, missing) * place.weights[n], blade.bead[k][l])
      blade.bead[k][l] -= give
      ;(target ?? layers.wet[l]).data[index] += give
    })
  }
}

function settledLayerFor(layers: BladeLayers, layer: number): Field | null {
  const c = layers.setInto.indexOf(layer)
  return c >= 0 ? layers.set[c] : null
}

function sweepStep(layers: BladeLayers, blade: Blade, stroke: BladeStroke, sweep: SweepState, texture: BladeTexture): void {
  const field = layers.wet[0]
  const last = blade.offsets.length - 1
  const { frame } = sweep
  for (let k = 0; k <= last; k++) {
    const pressure = pressureAt(blade, k, sweep)
    if (pressure <= 0 && sweep.travelled < blade.landAt[k]) continue
    const offset = blade.offsets[k]
    const x = frame.x + frame.normalX * offset
    const y = frame.y + frame.normalY * offset
    const place = footprint(field, x, y, layers.protect)
    if (place.indices.length === 0) continue
    blade.lastX[k] = x
    blade.lastY[k] = y
    chargeOnLanding(layers, blade, stroke, k, { x, y, frame, pressure, travelled: sweep.travelled })
    continueEdgeTone(layers, blade, k, place, sweep.travelled, stroke.dragLength)
    const nick = blade.nicks[k] * wear(offset, sweep.travelled, stroke)
    if (pressure > 0.02) {
      const gap = (stroke.clearance * nick * blade.edgeLift[k] * chatterAt(texture, stroke, offset, sweep.travelled)) / pressure
      place.indices.forEach((index, n) => scrape(layers, index, gap, blade.bead[k], place.weights[n]))
    }
    const edge = k === 0 || k === last ? EDGE_LEAK : 0
    const film = filmRate(stroke, blade.bead[k], layers.paintLayers) * nick * pressure
    depositInto(layers, place, blade.bead[k], Math.min(1, film + (1 - pressure) * RELEASE_DEPOSIT + edge))
  }
}

function releaseRemaining(layers: BladeLayers, blade: Blade): void {
  for (let k = 0; k < blade.offsets.length; k++) {
    if (Number.isNaN(blade.lastX[k])) continue
    depositInto(layers, footprint(layers.wet[0], blade.lastX[k], blade.lastY[k], layers.protect), blade.bead[k], 1)
  }
}

function settleOrphanedBead(layers: BladeLayers, blade: Blade): void {
  const anchor = blade.lastX.findIndex((x) => !Number.isNaN(x))
  if (anchor < 0) return
  const place = footprint(layers.wet[0], blade.lastX[anchor], blade.lastY[anchor], layers.protect)
  for (let k = 0; k < blade.offsets.length; k++) if (Number.isNaN(blade.lastX[k])) depositInto(layers, place, blade.bead[k], 1)
}

export function dragBlade(layers: BladeLayers, stroke: BladeStroke, texture: BladeTexture): void {
  if (stroke.path.length < 2) return
  const points = resample(stroke.path)
  const travel = (points.length - 1) * STEP
  const blade = makeBlade(stroke, layers.wet.length, texture, travel)
  const snapshot = new Float64Array(blade.offsets.length)
  const landingRamp = stroke.landingRamp ?? Math.min(travel * LAND_RAMP, stroke.width * LANDING_RAMP_IN_BLADE_WIDTHS)
  for (let i = 0; i < points.length; i++) {
    sweepStep(layers, blade, stroke, { frame: frameAt(points, i), travelled: i * STEP, travel, landingRamp }, texture)
    flowAlongBlade(blade, snapshot)
  }
  releaseRemaining(layers, blade)
  settleOrphanedBead(layers, blade)
}
