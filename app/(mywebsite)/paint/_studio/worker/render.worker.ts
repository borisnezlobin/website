import { renderInk } from '../engine/ink'
import { renderKnife } from '../engine/knife'
import { imageFromRgba, imageToRgba } from '../engine/raster'
import type { RenderRequest, RenderResponse } from './protocol'

function post(response: RenderResponse, transfer: Transferable[] = []): void {
  self.postMessage(response, { transfer })
}

self.onmessage = (event: MessageEvent<RenderRequest>) => {
  const { id, width, height, pixels, mask, job, faces } = event.data
  const started = performance.now()
  try {
    const image = imageFromRgba(pixels, width, height)
    const maskField = { width, height, data: mask }
    const report = (fraction: number, stage: string) => post({ id, type: 'progress', fraction, stage })
    const output = job.effect === 'knife' ? renderKnife(image, maskField, job.settings, report, faces) : renderInk(image, maskField, job.settings, report)
    const rgba = imageToRgba(output)
    post({ id, type: 'done', pixels: rgba, milliseconds: performance.now() - started }, [rgba.buffer])
  } catch (error) {
    post({ id, type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
