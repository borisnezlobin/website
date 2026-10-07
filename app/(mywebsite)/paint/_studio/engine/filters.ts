import { createField, type Field, type RgbImage, createImage, splitChannels, mergeChannels } from './raster'

function boxBlurHorizontal(source: Float32Array, target: Float32Array, width: number, height: number, radius: number): void {
  const span = radius * 2 + 1
  for (let y = 0; y < height; y++) {
    const row = y * width
    let sum = 0
    for (let k = -radius; k <= radius; k++) sum += source[row + Math.min(Math.max(k, 0), width - 1)]
    for (let x = 0; x < width; x++) {
      target[row + x] = sum / span
      const addIndex = Math.min(x + radius + 1, width - 1)
      const removeIndex = Math.max(x - radius, 0)
      sum += source[row + addIndex] - source[row + removeIndex]
    }
  }
}

function boxBlurVertical(source: Float32Array, target: Float32Array, width: number, height: number, radius: number): void {
  const span = radius * 2 + 1
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let k = -radius; k <= radius; k++) sum += source[Math.min(Math.max(k, 0), height - 1) * width + x]
    for (let y = 0; y < height; y++) {
      target[y * width + x] = sum / span
      const addIndex = Math.min(y + radius + 1, height - 1)
      const removeIndex = Math.max(y - radius, 0)
      sum += source[addIndex * width + x] - source[removeIndex * width + x]
    }
  }
}

function boxRadiiForGaussian(sigma: number, passes: number): number[] {
  const idealWidth = Math.sqrt((12 * sigma * sigma) / passes + 1)
  let lower = Math.floor(idealWidth)
  if (lower % 2 === 0) lower--
  const upper = lower + 2
  const idealLowerCount = (12 * sigma * sigma - passes * lower * lower - 4 * passes * lower - 3 * passes) / (-4 * lower - 4)
  const lowerCount = Math.round(idealLowerCount)
  return Array.from({ length: passes }, (_, i) => ((i < lowerCount ? lower : upper) - 1) / 2)
}

const WIDE_BLUR = 8
const SIGMA_PER_STEP = 4

export function gaussianBlurField(field: Field, sigma: number): Field {
  if (sigma < 0.3) return { ...field, data: field.data.slice() }
  if (sigma >= WIDE_BLUR) return wideBlur(field, sigma)
  return boxGaussian(field, sigma)
}

function wideBlur(field: Field, sigma: number): Field {
  const factor = Math.floor(sigma / SIGMA_PER_STEP)
  const reduced = boxGaussian(downsampleField(field, factor), Math.sqrt(sigma * sigma - (factor * factor) / 4) / factor)
  return upsampleField(reduced, field.width, field.height)
}

function boxGaussian(field: Field, sigma: number): Field {
  const { width, height } = field
  const current = field.data.slice()
  const scratch = new Float32Array(current.length)
  for (const radius of boxRadiiForGaussian(sigma, 3)) {
    if (radius < 1) continue
    boxBlurHorizontal(current, scratch, width, height, radius)
    boxBlurVertical(scratch, current, width, height, radius)
  }
  return { width, height, data: current }
}

export function gaussianBlurImage(image: RgbImage, sigma: number): RgbImage {
  const channels = splitChannels(image)
  return mergeChannels([
    gaussianBlurField(channels[0], sigma),
    gaussianBlurField(channels[1], sigma),
    gaussianBlurField(channels[2], sigma),
  ])
}

export function downsampleField(field: Field, factor: number): Field {
  const width = Math.max(1, Math.ceil(field.width / factor))
  const height = Math.max(1, Math.ceil(field.height / factor))
  const result = createField(width, height)
  const counts = new Float32Array(width * height)
  for (let y = 0; y < field.height; y++) {
    const ty = Math.floor(y / factor)
    for (let x = 0; x < field.width; x++) {
      const target = ty * width + Math.floor(x / factor)
      result.data[target] += field.data[y * field.width + x]
      counts[target]++
    }
  }
  for (let i = 0; i < result.data.length; i++) result.data[i] /= counts[i]
  return result
}

export function upsampleField(field: Field, width: number, height: number): Field {
  const result = createField(width, height)
  const scaleX = field.width / width
  const scaleY = field.height / height
  for (let y = 0; y < height; y++) {
    const sy = Math.min(Math.max((y + 0.5) * scaleY - 0.5, 0), field.height - 1)
    const y0 = Math.floor(sy)
    const y1 = Math.min(y0 + 1, field.height - 1)
    const fy = sy - y0
    for (let x = 0; x < width; x++) {
      const sx = Math.min(Math.max((x + 0.5) * scaleX - 0.5, 0), field.width - 1)
      const x0 = Math.floor(sx)
      const x1 = Math.min(x0 + 1, field.width - 1)
      const fx = sx - x0
      const top = field.data[y0 * field.width + x0] * (1 - fx) + field.data[y0 * field.width + x1] * fx
      const bottom = field.data[y1 * field.width + x0] * (1 - fx) + field.data[y1 * field.width + x1] * fx
      result.data[y * width + x] = top * (1 - fy) + bottom * fy
    }
  }
  return result
}

export function resizeImage(image: RgbImage, width: number, height: number): RgbImage {
  const factor = Math.max(1, Math.floor(Math.min(image.width / width, image.height / height)))
  const channels = splitChannels(image).map((channel) => {
    const reduced = factor > 1 ? downsampleField(channel, factor) : channel
    return upsampleField(reduced, width, height)
  }) as [Field, Field, Field]
  return mergeChannels(channels)
}

export function resizeField(field: Field, width: number, height: number): Field {
  const factor = Math.max(1, Math.floor(Math.min(field.width / width, field.height / height)))
  const reduced = factor > 1 ? downsampleField(field, factor) : field
  return upsampleField(reduced, width, height)
}

export interface Gradients {
  gx: Field
  gy: Field
}

export function sobel(field: Field): Gradients {
  const { width, height, data } = field
  const gx = createField(width, height)
  const gy = createField(width, height)
  const at = (x: number, y: number) =>
    data[Math.min(Math.max(y, 0), height - 1) * width + Math.min(Math.max(x, 0), width - 1)]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tl = at(x - 1, y - 1)
      const tc = at(x, y - 1)
      const tr = at(x + 1, y - 1)
      const ml = at(x - 1, y)
      const mr = at(x + 1, y)
      const bl = at(x - 1, y + 1)
      const bc = at(x, y + 1)
      const br = at(x + 1, y + 1)
      gx.data[y * width + x] = (tr + 2 * mr + br - tl - 2 * ml - bl) / 8
      gy.data[y * width + x] = (bl + 2 * bc + br - tl - 2 * tc - tr) / 8
    }
  }
  return { gx, gy }
}

export interface OrientationField {
  angle: Field
  coherence: Field
}

export function edgeTangentField(luma: Field, sigma: number): OrientationField {
  const { gx, gy } = sobel(luma)
  const { width, height } = luma
  const jxx = createField(width, height)
  const jxy = createField(width, height)
  const jyy = createField(width, height)
  for (let i = 0; i < gx.data.length; i++) {
    jxx.data[i] = gx.data[i] * gx.data[i]
    jxy.data[i] = gx.data[i] * gy.data[i]
    jyy.data[i] = gy.data[i] * gy.data[i]
  }
  const sxx = gaussianBlurField(jxx, sigma)
  const sxy = gaussianBlurField(jxy, sigma)
  const syy = gaussianBlurField(jyy, sigma)
  const angle = createField(width, height)
  const coherence = createField(width, height)
  for (let i = 0; i < angle.data.length; i++) {
    const a = sxx.data[i]
    const b = sxy.data[i]
    const c = syy.data[i]
    const gradientAngle = 0.5 * Math.atan2(2 * b, a - c)
    angle.data[i] = gradientAngle + Math.PI / 2
    const root = Math.sqrt((a - c) * (a - c) + 4 * b * b)
    coherence.data[i] = a + c > 1e-9 ? root / (a + c) : 0
  }
  return { angle, coherence }
}

function distanceTransform1d(f: Float64Array, length: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0
  v[0] = 0
  z[0] = -Infinity
  z[1] = Infinity
  for (let q = 1; q < length; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k--
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = Infinity
  }
  k = 0
  for (let q = 0; q < length; q++) {
    while (z[k + 1] < q) k++
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
}

interface LineScratch {
  f: Float64Array
  d: Float64Array
  v: Int32Array
  z: Float64Array
}

function transformLine(grid: Float64Array, start: number, stride: number, count: number, scratch: LineScratch): void {
  for (let n = 0; n < count; n++) scratch.f[n] = grid[start + n * stride]
  distanceTransform1d(scratch.f, count, scratch.d, scratch.v, scratch.z)
  for (let n = 0; n < count; n++) grid[start + n * stride] = scratch.d[n]
}

export function distanceToMask(mask: Field, threshold = 0.5): Field {
  const { width, height } = mask
  const big = 1e12
  const grid = new Float64Array(width * height)
  for (let i = 0; i < grid.length; i++) grid[i] = mask.data[i] >= threshold ? 0 : big
  const longest = Math.max(width, height)
  const f = new Float64Array(longest)
  const d = new Float64Array(longest)
  const v = new Int32Array(longest)
  const z = new Float64Array(longest + 1)
  const scratch = { f, d, v, z }
  for (let x = 0; x < width; x++) transformLine(grid, x, width, height, scratch)
  for (let y = 0; y < height; y++) transformLine(grid, y * width, 1, width, scratch)
  const result = createField(width, height)
  for (let i = 0; i < grid.length; i++) result.data[i] = Math.sqrt(grid[i])
  return result
}

const FILL_SCALES = [3, 9, 27, 81]
const FILL_COVERAGE = 0.02
const FILL_CORE_INSET = 2.5

const DEEP_INSIDE = 8

function distanceOutsideBelow(mask: Field, threshold: number): Field {
  const outside = createField(mask.width, mask.height)
  for (let i = 0; i < outside.data.length; i++) outside.data[i] = mask.data[i] >= threshold ? 0 : 1
  return distanceToMask(outside)
}

function solidCore(mask: Field): Field {
  const toUncertain = distanceOutsideBelow(mask, 0.9)
  const toOutline = distanceOutsideBelow(mask, 0.5)
  const core = createField(mask.width, mask.height)
  for (let i = 0; i < core.data.length; i++) core.data[i] = toUncertain.data[i] > FILL_CORE_INSET || toOutline.data[i] > DEEP_INSIDE ? 1 : 0
  return core
}

interface ScaleFill {
  colour: RgbImage
  weight: Field
}

function fillAtScale(image: RgbImage, core: Field, sigma: number): ScaleFill {
  const weighted = createImage(image.width, image.height)
  for (let i = 0; i < core.data.length; i++) for (let c = 0; c < 3; c++) weighted.data[i * 3 + c] = image.data[i * 3 + c] * core.data[i]
  return { colour: gaussianBlurImage(weighted, sigma), weight: gaussianBlurField(core, sigma) }
}

export function fillOutsideMask(image: RgbImage, mask: Field): RgbImage {
  const core = solidCore(mask)
  const result = createImage(image.width, image.height)
  result.data.set(image.data)
  const pending = new Uint8Array(core.data.length)
  for (let i = 0; i < pending.length; i++) pending[i] = core.data[i] > 0 ? 0 : 1
  for (const sigma of FILL_SCALES) {
    const fill = fillAtScale(image, core, sigma)
    for (let i = 0; i < pending.length; i++) {
      if (!pending[i] || fill.weight.data[i] < FILL_COVERAGE) continue
      for (let c = 0; c < 3; c++) result.data[i * 3 + c] = fill.colour.data[i * 3 + c] / fill.weight.data[i]
      pending[i] = 0
    }
  }
  return result
}

function onBorder(p: number, width: number, height: number): boolean {
  const x = p % width
  const y = (p - x) / width
  return x === 0 || y === 0 || x === width - 1 || y === height - 1
}

function fourNeighbours(p: number, width: number, height: number): number[] {
  const x = p % width
  const y = (p - x) / width
  const result: number[] = []
  if (x > 0) result.push(p - 1)
  if (x < width - 1) result.push(p + 1)
  if (y > 0) result.push(p - width)
  if (y < height - 1) result.push(p + width)
  return result
}

function collectRegion(isGap: Uint8Array, seen: Uint8Array, start: number, width: number, height: number): { pixels: number[]; touchesBorder: boolean } {
  const pixels = [start]
  let touchesBorder = false
  seen[start] = 1
  for (let n = 0; n < pixels.length; n++) {
    touchesBorder ||= onBorder(pixels[n], width, height)
    for (const q of fourNeighbours(pixels[n], width, height)) {
      if (seen[q] || !isGap[q]) continue
      seen[q] = 1
      pixels.push(q)
    }
  }
  return { pixels, touchesBorder }
}

export function fillSmallHoles(mask: Field, maxArea: number, threshold = 0.5): Field {
  const { width, height } = mask
  const filled = createField(width, height)
  filled.data.set(mask.data)
  const isGap = new Uint8Array(width * height)
  for (let i = 0; i < isGap.length; i++) isGap[i] = mask.data[i] < threshold ? 1 : 0
  const seen = new Uint8Array(width * height)
  for (let start = 0; start < isGap.length; start++) {
    if (!isGap[start] || seen[start]) continue
    const region = collectRegion(isGap, seen, start, width, height)
    if (region.touchesBorder || region.pixels.length > maxArea) continue
    for (const p of region.pixels) filled.data[p] = 1
  }
  return filled
}

export interface Hysteresis {
  sure: number
  likely: number
  firmValue: number
  minDepth: number
}

export function firmUpMask(mask: Field, hysteresis: Hysteresis): Field {
  const { width, height } = mask
  const firm = createField(width, height)
  firm.data.set(mask.data)
  const depth = distanceOutsideBelow(mask, hysteresis.likely)
  const queue: number[] = []
  const reached = new Uint8Array(width * height)
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i] < hysteresis.sure) continue
    reached[i] = 1
    queue.push(i)
  }
  for (let n = 0; n < queue.length; n++) {
    for (const q of fourNeighbours(queue[n], width, height)) {
      if (reached[q] || mask.data[q] < hysteresis.likely) continue
      reached[q] = 1
      if (depth.data[q] > hysteresis.minDepth) firm.data[q] = Math.max(firm.data[q], hysteresis.firmValue)
      queue.push(q)
    }
  }
  return firm
}
