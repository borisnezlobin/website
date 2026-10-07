export interface StencilWeights {
  east: Float32Array
  south: Float32Array
  southEast: Float32Array
  southWest: Float32Array
}

export interface Transport {
  weights: StencilWeights
  width: number
  height: number
  volume: Float32Array
  waterRate: number
  diffusionRate: number
  flowEast: Float32Array
  flowSouth: Float32Array
  flowRate: number
  settleRate: number
  absorbRate: number
  reach: number[]
}

export interface CapillaryState {
  inks: Float32Array[]
  stained: Float32Array[]
  wetness: Float32Array
}

function exchange(next: Float32Array, from: number, to: number, amount: number): void {
  next[from] -= amount
  next[to] += amount
}

function inkPerWater(ink: Float32Array, wetness: Float32Array, volume: Float32Array, index: number): number {
  const water = wetness[index] * volume[index]
  return water > 1e-9 ? ink[index] / water : 0
}

function flowAcrossFace(state: CapillaryState, scratch: Float32Array[], transport: Transport, from: number, to: number, weight: number): void {
  if (weight <= 0) return
  const { wetness, inks } = state
  const { volume } = transport
  const wetFrom = wetness[from]
  const wetTo = wetness[to]
  const wet = 0.5 * (wetFrom + wetTo)
  const waterFlux = transport.waterRate * weight * wet * wet * (wetFrom - wetTo)
  exchange(scratch[inks.length], from, to, waterFlux)
  const source = waterFlux > 0 ? from : to
  const wetFace = Math.min(1, wetFrom, wetTo)
  const diffusion = transport.diffusionRate * weight * wetFace
  for (let c = 0; c < inks.length; c++) {
    const ink = inks[c]
    const carried = waterFlux * inkPerWater(ink, wetness, volume, source)
    const densityGap = ink[from] / volume[from] - ink[to] / volume[to]
    exchange(scratch[c], from, to, (carried + diffusion * densityGap) * transport.reach[c])
  }
}

function flowAllFaces(state: CapillaryState, scratch: Float32Array[], transport: Transport): void {
  const { weights, width, height } = transport
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (x + 1 < width) flowAcrossFace(state, scratch, transport, i, i + 1, weights.east[i])
      if (y + 1 < height) flowAcrossFace(state, scratch, transport, i, i + width, weights.south[i])
      if (x + 1 < width && y + 1 < height) flowAcrossFace(state, scratch, transport, i, i + width + 1, weights.southEast[i])
      if (x > 0 && y + 1 < height) flowAcrossFace(state, scratch, transport, i, i + width - 1, weights.southWest[i])
    }
  }
}

function driftAcross(state: CapillaryState, nextInks: Float32Array[], i: number, j: number, velocity: number, transport: Transport): void {
  if (velocity === 0) return
  const carrier = Math.min(1, state.wetness[i], state.wetness[j])
  const source = velocity > 0 ? i : j
  const sign = velocity > 0 ? 1 : -1
  for (let c = 0; c < state.inks.length; c++) {
    const density = state.inks[c][source] / transport.volume[source]
    exchange(nextInks[c], i, j, sign * Math.abs(velocity) * carrier * density * transport.reach[c])
  }
}

function driftAll(state: CapillaryState, nextInks: Float32Array[], transport: Transport): void {
  const { width, height } = transport
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (x + 1 < width) driftAcross(state, nextInks, i, i + 1, transport.flowEast[i] * transport.flowRate, transport)
      if (y + 1 < height) driftAcross(state, nextInks, i, i + width, transport.flowSouth[i] * transport.flowRate, transport)
    }
  }
}

export function transportStep(state: CapillaryState, scratch: Float32Array[], transport: Transport): void {
  const { inks, stained, wetness } = state
  const { volume } = transport
  const water = scratch[inks.length]
  for (let i = 0; i < wetness.length; i++) water[i] = wetness[i] * volume[i]
  for (let c = 0; c < inks.length; c++) scratch[c].set(inks[c])
  flowAllFaces(state, scratch, transport)
  driftAll(state, scratch, transport)
  for (let i = 0; i < wetness.length; i++) wetness[i] = (water[i] / volume[i]) * (1 - transport.absorbRate)
  for (let c = 0; c < inks.length; c++) {
    const next = scratch[c]
    for (let i = 0; i < next.length; i++) {
      const settled = next[i] * transport.settleRate
      stained[c][i] += settled
      inks[c][i] = next[i] - settled
    }
  }
}
