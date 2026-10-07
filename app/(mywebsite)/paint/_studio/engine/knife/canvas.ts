import type { Rgb } from '../color'
import { fractalNoise2, valueNoise2 } from '../random'
import { createField, createImage, type Field, type RgbImage } from '../raster'

export interface PaintCanvas {
  width: number
  height: number
  color: RgbImage
  thickness: Field
  paint: Field
  tooth: Field
  layer?: LayerTracking
}

export interface LayerTracking {
  colorWeight: Field
  thicknessWeight: Field
  groundPaint: Field
  groundThickness: Field
}

export interface LayerGround {
  paint: Field
  thickness: Field
}

let sharedTooth: Field | null = null

function canvasTooth(width: number, height: number): Field {
  if (sharedTooth?.width === width && sharedTooth.height === height) return sharedTooth
  const tooth = createField(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) tooth.data[y * width + x] = 0.6 * valueNoise2(x * 0.7, y * 0.7, 5) + 0.4 * valueNoise2(x * 0.23, y * 0.23, 11)
  }
  sharedTooth = tooth
  return tooth
}

function filledField(width: number, height: number, value: number): Field {
  const field = createField(width, height)
  field.data.fill(value)
  return field
}

export function createPaintLayer(width: number, height: number, ground: LayerGround): PaintCanvas {
  return {
    width,
    height,
    color: createImage(width, height),
    thickness: createField(width, height),
    paint: createField(width, height),
    tooth: canvasTooth(width, height),
    layer: { colorWeight: filledField(width, height, 1), thicknessWeight: filledField(width, height, 1), groundPaint: ground.paint, groundThickness: ground.thickness },
  }
}

export function copyPaintCanvas(canvas: PaintCanvas): PaintCanvas {
  return {
    width: canvas.width,
    height: canvas.height,
    color: { ...canvas.color, data: canvas.color.data.slice() },
    thickness: { ...canvas.thickness, data: canvas.thickness.data.slice() },
    paint: { ...canvas.paint, data: canvas.paint.data.slice() },
    tooth: canvas.tooth,
  }
}

export function compositeLayer(below: PaintCanvas, layer: PaintCanvas): PaintCanvas {
  const tracking = layer.layer
  if (!tracking) throw new Error('compositeLayer needs a layer canvas')
  const result = copyPaintCanvas(below)
  for (let i = 0; i < result.paint.data.length; i++) {
    const weight = tracking.colorWeight.data[i]
    for (let c = 0; c < 3; c++) result.color.data[i * 3 + c] = layer.color.data[i * 3 + c] + weight * below.color.data[i * 3 + c]
    result.thickness.data[i] = layer.thickness.data[i] + tracking.thicknessWeight.data[i] * below.thickness.data[i]
    result.paint.data[i] = Math.max(below.paint.data[i], layer.paint.data[i])
  }
  return result
}

export function createPaintCanvas(width: number, height: number, ground: Rgb, seed: number): PaintCanvas {
  const color = createImage(width, height)
  const scale = Math.max(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x - width / 2) / scale
      const ny = (y - height / 2) / scale
      const vignette = 1 + 0.03 * (1 - Math.min(1, (nx * nx + ny * ny) * 3.2))
      const grain = (fractalNoise2(x / 1.3, y / 1.3, seed, 2) - 0.5) * 0.008
      const i = (y * width + x) * 3
      for (let c = 0; c < 3; c++) color.data[i + c] = Math.min(1, ground[c] * vignette + grain)
    }
  }
  return { width, height, color, thickness: createField(width, height), paint: createField(width, height), tooth: canvasTooth(width, height) }
}
