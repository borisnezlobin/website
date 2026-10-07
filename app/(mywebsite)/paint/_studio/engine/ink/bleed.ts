import { edgeTangentField, gaussianBlurField } from '../filters'
import { fractalNoise2 } from '../random'
import { clamp01, createField, type Field } from '../raster'
import { transportStep, type CapillaryState, type StencilWeights, type Transport } from './capillary'
import { coarseGrid, reconstructLocally, restrictMean, restrictSum, type CoarseGrid } from './grid'

export interface BleedSettings {
  radius: number
  layerReach: number[]
  hold: number
  settle: number
  wetSpread: number
  fiber: number
  driftAngle: number
  drift: number
  anisotropy: number
  flowAlignment: number
  seed: number
}

export const MAX_ANISOTROPY = 0.7
const TARGET_GRID_SIGMA = 5
const MAX_OUTFLOW_PER_STEP = 0.85

function paperMottling(grid: CoarseGrid, fiber: number, seed: number): Float32Array {
  const mottling = new Float32Array(grid.fineWidth * grid.fineHeight)
  for (let y = 0; y < grid.fineHeight; y++) {
    for (let x = 0; x < grid.fineWidth; x++) {
      const grain = fractalNoise2(x / 2.5, y / 2.5, seed + 71, 3)
      mottling[y * grid.fineWidth + x] = Math.max(0.05, 1 + fiber * 1.4 * (grain - 0.5))
    }
  }
  return mottling
}

function permeability(water: Field, fiber: number, factor: number, seed: number): Float32Array {
  const { width, height } = water
  const cell = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const capillary = fractalNoise2((x * factor) / 4, (y * factor) / 4, seed, 4)
      const texture = Math.max(0, 1 + fiber * (2 * capillary - 1) * 1.6)
      cell[y * width + x] = Math.min(1, texture * water.data[y * width + x])
    }
  }
  return cell
}

export function decomposeTensor(conductance: number, angle: number, anisotropy: number): [number, number, number, number] {
  const a = Math.min(anisotropy, MAX_ANISOTROPY)
  const xx = conductance * (1 + a * Math.cos(2 * angle))
  const yy = conductance * (1 - a * Math.cos(2 * angle))
  const xy = conductance * a * Math.sin(2 * angle)
  const diagonal = Math.abs(xy)
  return [xx - diagonal, yy - diagonal, Math.max(0, 2 * xy), Math.max(0, -2 * xy)]
}

function stencilWeights(cell: Float32Array, orientation: Field, anisotropy: number): StencilWeights {
  const { width, height } = orientation
  const size = width * height
  const axisX = new Float32Array(size)
  const axisY = new Float32Array(size)
  const diagonalDown = new Float32Array(size)
  const diagonalUp = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    const [wx, wy, w45, w135] = decomposeTensor(cell[i], orientation.data[i], anisotropy)
    axisX[i] = wx
    axisY[i] = wy
    diagonalDown[i] = w45
    diagonalUp[i] = w135
  }
  const weights: StencilWeights = { east: new Float32Array(size), south: new Float32Array(size), southEast: new Float32Array(size), southWest: new Float32Array(size) }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (x + 1 < width) weights.east[i] = 0.5 * (axisX[i] + axisX[i + 1])
      if (y + 1 < height) weights.south[i] = 0.5 * (axisY[i] + axisY[i + width])
      if (x + 1 < width && y + 1 < height) weights.southEast[i] = 0.25 * (diagonalDown[i] + diagonalDown[i + width + 1])
      if (x > 0 && y + 1 < height) weights.southWest[i] = 0.25 * (diagonalUp[i] + diagonalUp[i + width - 1])
    }
  }
  return weights
}

export function maxOutflow(weights: StencilWeights, width: number, height: number): number {
  let peak = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      let total = weights.east[i] + weights.south[i] + weights.southEast[i] + weights.southWest[i]
      if (x > 0) total += weights.east[i - 1]
      if (y > 0) total += weights.south[i - width]
      if (x > 0 && y > 0) total += weights.southEast[i - width - 1]
      if (x + 1 < width && y > 0) total += weights.southWest[i - width + 1]
      peak = Math.max(peak, total)
    }
  }
  return peak
}

interface FlowField {
  east: Float32Array
  south: Float32Array
}

function flowDirection(angle: number, driftAngle: number, alignment: number): [number, number] {
  const biasX = Math.cos(driftAngle)
  const biasY = Math.sin(driftAngle)
  let alongX = Math.cos(angle)
  let alongY = Math.sin(angle)
  if (alongX * biasX + alongY * biasY < 0) {
    alongX = -alongX
    alongY = -alongY
  }
  const x = alignment * alongX + (1 - alignment) * biasX
  const y = alignment * alongY + (1 - alignment) * biasY
  const length = Math.hypot(x, y) || 1
  return [x / length, y / length]
}

function flowField(orientation: Field, driftAngle: number, alignment: number): FlowField {
  const { width, height } = orientation
  const cellX = new Float32Array(width * height)
  const cellY = new Float32Array(width * height)
  for (let i = 0; i < cellX.length; i++) [cellX[i], cellY[i]] = flowDirection(orientation.data[i], driftAngle, alignment)
  const east = new Float32Array(width * height)
  const south = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (x + 1 < width) east[i] = 0.5 * (cellX[i] + cellX[i + 1])
      if (y + 1 < height) south[i] = 0.5 * (cellY[i] + cellY[i + width])
    }
  }
  return { east, south }
}

function inkOrientation(wet: Field, gridSigma: number): Field {
  return edgeTangentField(gaussianBlurField(wet, Math.max(1, gridSigma * 0.5)), Math.max(1.5, gridSigma * 1.5)).angle
}

interface Schedule {
  steps: number
  dt: number
  totalTime: number
}

function schedule(gridSigma: number, outflow: number, peakWater: number, gridDrift: number): Schedule {
  const totalTime = (gridSigma * gridSigma) / 2
  const velocity = gridDrift / Math.max(totalTime, 1e-6)
  const ratePerTime = outflow * Math.max(1, peakWater * peakWater) * 1.25 + 2 * Math.abs(velocity)
  const steps = Math.max(1, Math.ceil((totalTime * ratePerTime) / MAX_OUTFLOW_PER_STEP))
  return { steps, dt: totalTime / steps, totalTime }
}

function splitHeldInk(mobile: Field, hold: number): { held: Field; travelling: Field } {
  const held = createField(mobile.width, mobile.height)
  const travelling = createField(mobile.width, mobile.height)
  for (let i = 0; i < mobile.data.length; i++) {
    held.data[i] = mobile.data[i] * hold
    travelling.data[i] = mobile.data[i] - held.data[i]
  }
  return { held, travelling }
}

export interface BleedProgress {
  (fraction: number): void
}

function initialWetness(coarseWet: Float32Array, amount: number): Float32Array {
  const wetness = new Float32Array(coarseWet.length)
  for (let i = 0; i < wetness.length; i++) wetness[i] = coarseWet[i] * amount
  return wetness
}

function peakOf(values: Float32Array): number {
  let peak = 0
  for (const value of values) peak = Math.max(peak, value)
  return peak
}

interface BleedSetup {
  grid: CoarseGrid
  transport: Transport
  wetness: Float32Array
  steps: number
}

function prepareBleed(mobile: Field[], wetSource: Field, settings: BleedSettings): BleedSetup {
  const factor = Math.max(1, Math.ceil(settings.radius / TARGET_GRID_SIGMA))
  const grid = coarseGrid(mobile[0].width, mobile[0].height, factor)
  const gridSigma = settings.radius / factor
  const coarseWet = restrictMean(wetSource, grid)
  const orientation = inkOrientation({ width: grid.width, height: grid.height, data: coarseWet }, gridSigma)
  const texture = permeability({ width: grid.width, height: grid.height, data: new Float32Array(coarseWet.length).fill(1) }, settings.fiber, factor, settings.seed)
  const weights = stencilWeights(texture, orientation, settings.anisotropy)
  const flow = flowField(orientation, settings.driftAngle, clamp01(settings.flowAlignment))
  const wetness = initialWetness(coarseWet, settings.wetSpread)
  const plan = schedule(gridSigma, maxOutflow(weights, grid.width, grid.height), peakOf(wetness), settings.drift / factor)
  const reachPeak = Math.max(...settings.layerReach, 1)
  const transport: Transport = {
    weights,
    width: grid.width,
    height: grid.height,
    volume: grid.volume,
    waterRate: plan.dt,
    diffusionRate: plan.dt * 0.15,
    flowEast: flow.east,
    flowSouth: flow.south,
    flowRate: (settings.drift / factor / plan.totalTime) * plan.dt,
    settleRate: 1 - Math.exp((Math.log(1 - Math.min(settings.settle, 0.999)) / plan.totalTime) * plan.dt),
    absorbRate: 1 - Math.exp((-1.2 / plan.totalTime) * plan.dt),
    reach: settings.layerReach.map((r) => r / reachPeak),
  }
  return { grid, transport, wetness, steps: plan.steps }
}

export interface BleedDiagnostics {
  transportedBefore: number[]
  transportedAfter: number[]
  minimumInk: number
}

function totals(layers: Float32Array[], extra?: Float32Array[]): number[] {
  return layers.map((layer, c) => {
    let sum = 0
    for (let i = 0; i < layer.length; i++) sum += layer[i] + (extra ? extra[c][i] : 0)
    return sum
  })
}

function lowestValue(layers: Float32Array[]): number {
  let lowest = Infinity
  for (const layer of layers) for (const value of layer) lowest = Math.min(lowest, value)
  return lowest
}

export function bleedMobileInk(mobile: Field[], wetSource: Field, settings: BleedSettings, onProgress?: BleedProgress, diagnostics?: BleedDiagnostics): Field[] {
  if (settings.radius < 0.5) return mobile
  const { grid, transport, wetness, steps } = prepareBleed(mobile, wetSource, settings)
  const split = mobile.map((layer) => splitHeldInk(layer, clamp01(settings.hold)))
  const inks = split.map(({ travelling }) => restrictSum(travelling, grid))
  const before = inks.map((ink) => ink.slice())
  const state: CapillaryState = { inks, stained: inks.map((ink) => new Float32Array(ink.length)), wetness }
  const scratch = Array.from({ length: inks.length + 1 }, () => new Float32Array(wetness.length))
  if (diagnostics) diagnostics.transportedBefore = totals(inks)
  for (let s = 0; s < steps; s++) {
    transportStep(state, scratch, transport)
    if (diagnostics) diagnostics.minimumInk = Math.min(diagnostics.minimumInk, lowestValue(state.inks))
    if (onProgress && s % 16 === 0) onProgress(s / steps)
  }
  if (diagnostics) diagnostics.transportedAfter = totals(state.inks, state.stained)
  onProgress?.(1)
  const mottling = paperMottling(grid, settings.fiber, settings.seed)
  return split.map(({ held, travelling }, c) => {
    for (let i = 0; i < inks[c].length; i++) inks[c][i] += state.stained[c][i]
    const arrived = reconstructLocally(travelling, before[c], inks[c], grid, mottling)
    for (let i = 0; i < arrived.data.length; i++) arrived.data[i] += held.data[i]
    return arrived
  })
}
