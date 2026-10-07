import { distanceToMask, gaussianBlurField } from '../filters'
import { createField, type Field, type RgbImage } from '../raster'
import type { FaceBox, FaceZones } from './faces'

export const FEATURE_IMPORTANCE = 1
export const HAIR_IMPORTANCE = 0.65
export const FACE_IMPORTANCE = 0.45

export interface DetailMap {
  importance: Field
  hair: Field
}

const HAIR_REACH = 0.7

function hairZone(mask: Field, faces: FaceZones): Field {
  const oval = createField(mask.width, mask.height)
  for (let i = 0; i < oval.data.length; i++) oval.data[i] = faces.face.data[i] > 0.5 ? 1 : 0
  const fromFace = distanceToMask(oval)
  const reach = (faces.box.bottom - faces.box.top) * HAIR_REACH
  const hair = createField(mask.width, mask.height)
  for (let y = 0; y < Math.min(mask.height, Math.ceil(faces.box.bottom)); y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = y * mask.width + x
      if (mask.data[i] >= 0.5 && oval.data[i] === 0 && fromFace.data[i] < reach) hair.data[i] = 1
    }
  }
  return hair
}

function combine(faces: FaceZones, hair: Field, softness: number): Field {
  const importance = createField(hair.width, hair.height)
  for (let i = 0; i < importance.data.length; i++) {
    importance.data[i] = Math.max(faces.features.data[i] * FEATURE_IMPORTANCE, faces.face.data[i] * FACE_IMPORTANCE, hair.data[i] * HAIR_IMPORTANCE)
  }
  return gaussianBlurField(importance, softness)
}

const BLOB_SCALES = [0.5, 0.75, 1.1]
const BLOB_FLOOR = 0.95
const BLOB_PEAK = 0.998

function colourChannels(image: RgbImage): Field[] {
  const channels = [0, 1, 2].map(() => createField(image.width, image.height))
  for (let i = 0; i < channels[0].data.length; i++) {
    const [r, g, b] = [image.data[i * 3], image.data[i * 3 + 1], image.data[i * 3 + 2]]
    channels[0].data[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
    channels[1].data[i] = r - g
    channels[2].data[i] = b - g
  }
  return channels
}

function addBlobResponse(response: Float32Array, field: Field, scale: number): void {
  const { width, height, data } = field
  const weight = scale ** 4
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const dxx = data[i + 1] - 2 * data[i] + data[i - 1]
      const dyy = data[i + width] - 2 * data[i] + data[i - width]
      const dxy = (data[i + width + 1] - data[i + width - 1] - data[i - width + 1] + data[i - width - 1]) / 4
      response[i] += Math.max(0, dxx * dyy - dxy * dxy) * weight
    }
  }
}

function blobStrength(image: RgbImage, baseSize: number): Float32Array {
  const channels = colourChannels(image)
  const strongest = new Float32Array(image.width * image.height)
  for (const factor of BLOB_SCALES) {
    const scale = baseSize * factor
    const response = new Float32Array(strongest.length)
    for (const channel of channels) addBlobResponse(response, gaussianBlurField(channel, scale), scale)
    for (let i = 0; i < strongest.length; i++) strongest[i] = Math.max(strongest[i], Math.sqrt(response[i]))
  }
  return strongest
}

function quantile(values: number[], fraction: number): number {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0
}

function featureBlobs(image: RgbImage, mask: Field, baseSize: number): Field {
  const outside = createField(mask.width, mask.height)
  for (let i = 0; i < outside.data.length; i++) outside.data[i] = mask.data[i] >= 0.5 ? 0 : 1
  const depth = distanceToMask(outside)
  const strength = blobStrength(image, baseSize)
  const interior: number[] = []
  for (let i = 0; i < strength.length; i += 3) if (depth.data[i] > baseSize) interior.push(strength[i])
  const floor = quantile(interior, BLOB_FLOOR)
  const peak = Math.max(floor + 1e-6, quantile(interior, BLOB_PEAK))
  const blobs = createField(mask.width, mask.height)
  for (let i = 0; i < blobs.data.length; i++) blobs.data[i] = depth.data[i] > baseSize ? Math.min(1, Math.max(0, (strength[i] - floor) / (peak - floor))) : 0
  return blobs
}

function guessedImportance(image: RgbImage, mask: Field, box: FaceBox, baseSize: number, softness: number): DetailMap {
  const importance = createField(mask.width, mask.height)
  const blobs = featureBlobs(image, mask, baseSize)
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = y * mask.width + x
      const inBox = y >= box.top && y < box.bottom && x >= box.left && x < box.right
      importance.data[i] = Math.max(inBox ? FACE_IMPORTANCE * mask.data[i] : 0, blobs.data[i] * FEATURE_IMPORTANCE)
    }
  }
  return { importance: gaussianBlurField(importance, softness * 0.5), hair: createField(mask.width, mask.height) }
}

export function detailMapFor(image: RgbImage, mask: Field, faces: FaceZones | null, fallbackBox: FaceBox, baseSize: number): DetailMap {
  const softness = Math.max(1, baseSize * 0.5)
  if (!faces) return guessedImportance(image, mask, fallbackBox, baseSize, softness)
  const hair = hairZone(mask, faces)
  return { importance: combine(faces, hair, softness), hair: gaussianBlurField(hair, softness) }
}
