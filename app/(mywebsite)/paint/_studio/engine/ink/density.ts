import { linearToSrgb, srgbToLinear, type Rgb } from '../color'
import { createField, createImage, type Field, type RgbImage } from '../raster'

const MIN_REFLECTANCE = 1e-4

export type DensityLayers = [Field, Field, Field]

export function estimatePaperColor(image: RgbImage): Rgb {
  const pixelCount = image.width * image.height
  const lumas = new Float32Array(pixelCount)
  for (let p = 0; p < pixelCount; p++) {
    lumas[p] = 0.2126 * image.data[p * 3] + 0.7152 * image.data[p * 3 + 1] + 0.0722 * image.data[p * 3 + 2]
  }
  const sorted = lumas.slice().sort()
  const cutoff = sorted[Math.floor(pixelCount * 0.9)]
  const sum = [0, 0, 0]
  let count = 0
  for (let p = 0; p < pixelCount; p++) {
    if (lumas[p] < cutoff) continue
    sum[0] += image.data[p * 3]
    sum[1] += image.data[p * 3 + 1]
    sum[2] += image.data[p * 3 + 2]
    count++
  }
  if (count === 0) return [1, 1, 1]
  return [sum[0] / count, sum[1] / count, sum[2] / count]
}

const MIN_PAPER_REFLECTANCE = 1e-3

function paperReflectance(paper: Rgb): number[] {
  return paper.map((value) => Math.max(srgbToLinear(value), MIN_PAPER_REFLECTANCE))
}

export function toDensity(image: RgbImage, paper: Rgb): DensityLayers {
  const { width, height } = image
  const layers: DensityLayers = [createField(width, height), createField(width, height), createField(width, height)]
  const paperLinear = paperReflectance(paper)
  for (let p = 0; p < width * height; p++) {
    for (let c = 0; c < 3; c++) {
      const reflectance = Math.max(srgbToLinear(image.data[p * 3 + c]), MIN_REFLECTANCE)
      layers[c].data[p] = -Math.log(reflectance / paperLinear[c])
    }
  }
  return layers
}

export function fromDensity(layers: DensityLayers, paper: Rgb): RgbImage {
  const { width, height } = layers[0]
  const image = createImage(width, height)
  const paperLinear = paperReflectance(paper)
  for (let p = 0; p < width * height; p++) {
    for (let c = 0; c < 3; c++) {
      image.data[p * 3 + c] = linearToSrgb(paperLinear[c] * Math.exp(-layers[c].data[p]))
    }
  }
  return image
}

export const SATURATION_HEADROOM = 0.985

export function toInkAmount(visibleDensity: number, saturation: number): number {
  if (visibleDensity <= 0) return visibleDensity
  const ratio = Math.min(visibleDensity / saturation, SATURATION_HEADROOM)
  return -saturation * Math.log(1 - ratio)
}

export function toVisibleDensity(inkAmount: number, saturation: number): number {
  if (inkAmount <= 0) return inkAmount
  return saturation * (1 - Math.exp(-inkAmount / saturation))
}
