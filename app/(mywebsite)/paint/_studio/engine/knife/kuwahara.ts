import { createImage, type RgbImage } from '../raster'

export interface SummedTables {
  width: number
  height: number
  stride: number
  red: Float64Array
  green: Float64Array
  blue: Float64Array
  luma: Float64Array
  lumaSquared: Float64Array
}

export function summedTables(image: RgbImage): SummedTables {
  const stride = image.width + 1
  const size = stride * (image.height + 1)
  const tables: SummedTables = {
    width: image.width,
    height: image.height,
    stride,
    red: new Float64Array(size),
    green: new Float64Array(size),
    blue: new Float64Array(size),
    luma: new Float64Array(size),
    lumaSquared: new Float64Array(size),
  }
  for (let y = 0; y < image.height; y++) accumulateRow(tables, image, y)
  return tables
}

function accumulateRow(tables: SummedTables, image: RgbImage, y: number): void {
  const { stride, red, green, blue, luma, lumaSquared } = tables
  for (let x = 0; x < image.width; x++) {
    const p = (y * image.width + x) * 3
    const at = (y + 1) * stride + x + 1
    const above = at - stride
    const r = image.data[p]
    const g = image.data[p + 1]
    const b = image.data[p + 2]
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
    red[at] = r + red[at - 1] + red[above] - red[above - 1]
    green[at] = g + green[at - 1] + green[above] - green[above - 1]
    blue[at] = b + blue[at - 1] + blue[above] - blue[above - 1]
    luma[at] = l + luma[at - 1] + luma[above] - luma[above - 1]
    lumaSquared[at] = l * l + lumaSquared[at - 1] + lumaSquared[above] - lumaSquared[above - 1]
  }
}

function boxSum(table: Float64Array, stride: number, x0: number, y0: number, x1: number, y1: number): number {
  return table[y1 * stride + x1] - table[y0 * stride + x1] - table[y1 * stride + x0] + table[y0 * stride + x0]
}

interface Calmest {
  x0: number
  y0: number
  x1: number
  y1: number
  variance: number
}

function considerQuadrant(tables: SummedTables, best: Calmest, x0: number, y0: number, x1: number, y1: number): void {
  const count = (x1 - x0) * (y1 - y0)
  if (count <= 0) return
  const mean = boxSum(tables.luma, tables.stride, x0, y0, x1, y1) / count
  const variance = boxSum(tables.lumaSquared, tables.stride, x0, y0, x1, y1) / count - mean * mean
  if (variance >= best.variance) return
  best.variance = variance
  best.x0 = x0
  best.y0 = y0
  best.x1 = x1
  best.y1 = y1
}

function writeCalmestMean(tables: SummedTables, best: Calmest, result: RgbImage, p: number): void {
  const { stride } = tables
  const count = (best.x1 - best.x0) * (best.y1 - best.y0)
  result.data[p] = boxSum(tables.red, stride, best.x0, best.y0, best.x1, best.y1) / count
  result.data[p + 1] = boxSum(tables.green, stride, best.x0, best.y0, best.x1, best.y1) / count
  result.data[p + 2] = boxSum(tables.blue, stride, best.x0, best.y0, best.x1, best.y1) / count
}

export function kuwahara(tables: SummedTables, radius: number): RgbImage {
  const r = Math.max(1, Math.round(radius))
  const { width, height } = tables
  const result = createImage(width, height)
  const best: Calmest = { x0: 0, y0: 0, x1: 0, y1: 0, variance: Infinity }
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - r)
    const bottom = Math.min(height, y + r + 1)
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - r)
      const right = Math.min(width, x + r + 1)
      best.variance = Infinity
      considerQuadrant(tables, best, left, top, x + 1, y + 1)
      considerQuadrant(tables, best, x, top, right, y + 1)
      considerQuadrant(tables, best, left, y, x + 1, bottom)
      considerQuadrant(tables, best, x, y, right, bottom)
      writeCalmestMean(tables, best, result, (y * width + x) * 3)
    }
  }
  return result
}
