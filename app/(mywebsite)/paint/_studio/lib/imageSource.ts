export const WORKING_LONG_SIDE = 1400

export interface LoadedPhoto {
  name: string
  image: ImageData
}

function fitWithin(width: number, height: number, longSide: number): { width: number; height: number } {
  const scale = Math.min(1, longSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function drawToImageData(source: CanvasImageSource, width: number, height: number): ImageData {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('This browser can’t read image pixels.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(source, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}

const HEIF_EXTENSION = /\.(heic|heif|hif)$/i
const HEIF_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'])

async function fileTypeBrand(blob: Blob): Promise<string> {
  const header = new Uint8Array(await blob.slice(4, 12).arrayBuffer())
  const box = String.fromCharCode(...header.slice(0, 4))
  return box === 'ftyp' ? String.fromCharCode(...header.slice(4, 8)) : ''
}

async function isHeif(blob: Blob, name: string): Promise<boolean> {
  if (/image\/hei[cf]/.test(blob.type) || HEIF_EXTENSION.test(name)) return true
  return HEIF_BRANDS.has(await fileTypeBrand(blob))
}

async function decodeHeif(blob: Blob): Promise<ImageBitmap> {
  const { heicTo } = await import('heic-to')
  return heicTo({ blob, type: 'bitmap' })
}

async function decodePhoto(blob: Blob, name: string): Promise<ImageBitmap> {
  return (await isHeif(blob, name)) ? decodeHeif(blob) : createImageBitmap(blob)
}

export async function loadPhoto(blob: Blob, name: string): Promise<LoadedPhoto> {
  const bitmap = await decodePhoto(blob, name)
  const size = fitWithin(bitmap.width, bitmap.height, WORKING_LONG_SIDE)
  const image = drawToImageData(bitmap, size.width, size.height)
  bitmap.close()
  return { name, image }
}

export async function loadPhotoFromUrl(url: string, name: string): Promise<LoadedPhoto> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Couldn’t load ${name}.`)
  return loadPhoto(await response.blob(), name)
}

export function drawToImageDataKeepingAlpha(source: CanvasImageSource, width: number, height: number): ImageData {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('This browser can’t read image pixels.')
  context.drawImage(source, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}

export function alphaMask(pixels: ImageData): Float32Array {
  const mask = new Float32Array(pixels.width * pixels.height)
  for (let i = 0; i < mask.length; i++) mask[i] = pixels.data[i * 4 + 3] / 255
  return mask
}

export function fullMask(image: ImageData): Float32Array {
  return new Float32Array(image.width * image.height).fill(1)
}

export async function encodePng(pixels: Uint8ClampedArray, width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser can’t export images.')
  context.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}
