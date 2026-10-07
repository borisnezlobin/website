import type { FaceShape } from '../engine/knife'
import type { RenderRequest, RenderResponse, RenderSettings } from '../worker/protocol'

export interface RenderCallbacks {
  onProgress: (fraction: number, stage: string) => void
}

export interface RenderOutcome {
  pixels: Uint8ClampedArray
  milliseconds: number
}

export class RenderCancelled extends Error {
  constructor() {
    super('Render cancelled')
    this.name = 'RenderCancelled'
  }
}

interface PendingRender {
  request: RenderRequest
  source: ImageData
  callbacks: RenderCallbacks
  resolve: (outcome: RenderOutcome) => void
  reject: (reason: Error) => void
  abandoned: boolean
}

function requestFor(id: number, source: ImageData, mask: Float32Array, job: RenderSettings, faces: FaceShape[]): RenderRequest {
  return { id, width: source.width, height: source.height, pixels: new Uint8ClampedArray(source.data), mask: mask.slice(), job, faces }
}

function abandon(render: PendingRender | null): void {
  if (!render || render.abandoned) return
  render.abandoned = true
  render.reject(new RenderCancelled())
}

function settle(render: PendingRender, message: RenderResponse): void {
  if (render.abandoned || message.type === 'progress') return
  if (message.type === 'error') render.reject(new Error(message.message))
  else render.resolve({ pixels: message.pixels, milliseconds: message.milliseconds })
}

export class RenderClient {
  private worker: Worker | null = null
  private running: PendingRender | null = null
  private queued: PendingRender | null = null
  private nextId = 1

  render(source: ImageData, mask: Float32Array, job: RenderSettings, callbacks: RenderCallbacks, faces: FaceShape[] = []): Promise<RenderOutcome> {
    return new Promise((resolve, reject) => {
      const request = requestFor(this.nextId++, source, mask, job, faces)
      this.enqueue({ request, source, callbacks, resolve, reject, abandoned: false })
    })
  }

  cancel(): void {
    abandon(this.running)
    abandon(this.queued)
    this.queued = null
  }

  private enqueue(render: PendingRender): void {
    abandon(this.queued)
    this.queued = null
    if (this.running && this.running.source !== render.source) this.restartWorker()
    if (!this.running) return this.start(render)
    abandon(this.running)
    this.queued = render
  }

  private restartWorker(): void {
    this.worker?.terminate()
    this.worker = null
    abandon(this.running)
    this.running = null
  }

  private workerReady(): Worker {
    if (this.worker) return this.worker
    const worker = new Worker(new URL('../worker/render.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<RenderResponse>) => this.receive(event.data)
    worker.onerror = (event) => this.fail(event.message || 'The painting worker stopped unexpectedly.')
    this.worker = worker
    return worker
  }

  private start(render: PendingRender): void {
    this.running = render
    try {
      this.workerReady().postMessage(render.request, [render.request.pixels.buffer, render.request.mask.buffer])
    } catch (error) {
      this.fail(error instanceof Error ? error.message : String(error))
    }
  }

  private receive(message: RenderResponse): void {
    const render = this.running
    if (!render || message.id !== render.request.id) return
    if (message.type === 'progress') {
      if (!render.abandoned) render.callbacks.onProgress(message.fraction, message.stage)
      return
    }
    this.running = null
    settle(render, message)
    this.startQueued()
  }

  private startQueued(): void {
    const next = this.queued
    this.queued = null
    if (next) this.start(next)
  }

  private fail(message: string): void {
    const render = this.running
    this.worker?.terminate()
    this.worker = null
    this.running = null
    if (render && !render.abandoned) render.reject(new Error(message))
    this.startQueued()
  }
}
