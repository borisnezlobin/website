import { alphaMask, drawToImageDataKeepingAlpha } from './imageSource'

export type SegmentationProgress = (fraction: number) => void

function imageDataToBlob(image: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(image.width, image.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser can’t prepare the photo.')
  context.putImageData(image, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}

const FINDER = { model: 'isnet_fp16', device: 'gpu', output: { format: 'image/png' } } as const
const WARM_UP_SIZE = 32

let warmingUp: Promise<void> | null = null
const downloads = new Map<string, { current: number; total: number }>()
const downloadListeners = new Set<SegmentationProgress>()

function downloadFraction(): number {
  let current = 0
  let total = 0
  for (const part of downloads.values()) {
    current += part.current
    total += part.total
  }
  return total > 0 ? current / total : 0
}

function trackDownload(key: string, current: number, total: number): void {
  if (!key.startsWith('fetch:')) return
  downloads.set(key, { current, total })
  const fraction = downloadFraction()
  downloadListeners.forEach((listener) => listener(fraction))
}

async function runWarmUp(): Promise<void> {
  const { removeBackground } = await import('@imgly/background-removal')
  const tiny = new ImageData(WARM_UP_SIZE, WARM_UP_SIZE)
  await removeBackground(await imageDataToBlob(tiny), { ...FINDER, progress: trackDownload })
}

async function waitForWarmUp(onProgress?: SegmentationProgress): Promise<void> {
  if (onProgress) downloadListeners.add(onProgress)
  try {
    await warmUpSubjectFinder()
  } finally {
    if (onProgress) downloadListeners.delete(onProgress)
  }
}

export function warmUpSubjectFinder(): Promise<void> {
  warmingUp ??= runWarmUp().catch(() => undefined)
  return warmingUp
}

export async function findSubject(image: ImageData, onProgress?: SegmentationProgress): Promise<Float32Array> {
  await waitForWarmUp(onProgress)
  onProgress?.(1)
  const { removeBackground } = await import('@imgly/background-removal')
  const cutout = await removeBackground(await imageDataToBlob(image), FINDER)
  const bitmap = await createImageBitmap(cutout)
  const pixels = drawToImageDataKeepingAlpha(bitmap, image.width, image.height)
  bitmap.close()
  return alphaMask(pixels)
}
