import type { InkSettings } from '../engine/ink'
import type { FaceShape, KnifeSettings } from '../engine/knife'

export type EffectId = 'knife' | 'ink'

export type RenderSettings = { effect: 'knife'; settings: KnifeSettings } | { effect: 'ink'; settings: InkSettings }

export interface RenderRequest {
  id: number
  width: number
  height: number
  pixels: Uint8ClampedArray
  mask: Float32Array
  job: RenderSettings
  faces: FaceShape[]
}

export type RenderResponse =
  | { id: number; type: 'progress'; fraction: number; stage: string }
  | { id: number; type: 'done'; pixels: Uint8ClampedArray; milliseconds: number }
  | { id: number; type: 'error'; message: string }
