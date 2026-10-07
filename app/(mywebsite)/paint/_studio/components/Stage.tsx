import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react'
import type { SmudgePoint, SmudgeStroke } from '../engine/ink'
import type { RenderedImage, RenderState } from '../state/studio'
import { useContainedSize } from '../lib/useContainedSize'
import { RenderVeil } from './RenderVeil'

export type StageTool =
  | { kind: 'none' }
  | { kind: 'smear'; radius: number; onStroke: (stroke: SmudgeStroke) => void }
  | { kind: 'pick'; onPick: (color: [number, number, number]) => void }

interface StageProps {
  original: ImageData
  result: RenderedImage | null
  resultIsCurrent: boolean
  render: RenderState
  busyLabel: string | null
  comparing: boolean
  tool: StageTool
}

function paintCanvas(canvas: HTMLCanvasElement | null, pixels: ImageData | null): void {
  if (!canvas || !pixels) return
  canvas.width = pixels.width
  canvas.height = pixels.height
  canvas.getContext('2d')?.putImageData(pixels, 0, 0)
}

function resultImageData(result: RenderedImage | null, original: ImageData): ImageData | null {
  if (!result || result.width !== original.width || result.height !== original.height) return null
  return new ImageData(new Uint8ClampedArray(result.pixels), result.width, result.height)
}

function capturePointer(event: PointerEvent<HTMLElement>): void {
  try {
    event.currentTarget.setPointerCapture(event.pointerId)
  } catch {
    return
  }
}

function toImagePoint(event: PointerEvent<HTMLElement>, width: number): SmudgePoint & { scale: number } {
  const box = event.currentTarget.getBoundingClientRect()
  const scale = width / box.width
  return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale, scale }
}

function averageColor(image: ImageData, x: number, y: number): [number, number, number] {
  const total = [0, 0, 0]
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const px = Math.min(image.width - 1, Math.max(0, Math.round(x) + dx))
      const py = Math.min(image.height - 1, Math.max(0, Math.round(y) + dy))
      const index = (py * image.width + px) * 4
      for (let c = 0; c < 3; c++) total[c] += image.data[index + c] / 255
      count++
    }
  }
  return [total[0] / count, total[1] / count, total[2] / count]
}

interface Gesture {
  pointerId: number
  points: SmudgePoint[]
  source: ImageData
  kind: StageTool['kind']
}

function useStageGesture(original: ImageData, tool: StageTool) {
  const [drawn, setDrawn] = useState<Gesture | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const belongsHere = (candidate: Gesture | null): candidate is Gesture => candidate !== null && candidate.source === original && candidate.kind === tool.kind
  const path = belongsHere(drawn) ? drawn.points : []

  useEffect(() => {
    gesture.current = null
  }, [tool.kind, original])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (tool.kind === 'none' || belongsHere(gesture.current)) return
    const point = toImagePoint(event, original.width)
    if (tool.kind === 'pick') {
      tool.onPick(averageColor(original, point.x, point.y))
      return
    }
    capturePointer(event)
    gesture.current = { pointerId: event.pointerId, points: [{ x: point.x, y: point.y }], source: original, kind: tool.kind }
    setDrawn(gesture.current)
  }
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const active = gesture.current
    if (!belongsHere(active) || active.pointerId !== event.pointerId) return
    const point = toImagePoint(event, original.width)
    gesture.current = { ...active, points: [...active.points, { x: point.x, y: point.y }] }
    setDrawn(gesture.current)
  }
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const active = gesture.current
    if (!belongsHere(active) || active.pointerId !== event.pointerId) return
    const point = toImagePoint(event, original.width)
    const points = [...active.points, { x: point.x, y: point.y }]
    gesture.current = null
    setDrawn(null)
    if (tool.kind === 'smear' && points.length > 1) tool.onStroke({ points, radius: tool.radius })
  }
  const onPointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDrawn(null)
  }
  return { path, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } }
}

function busyState(render: RenderState, busyLabel: string | null, resultIsCurrent: boolean): { busy: boolean; fraction: number; label: string } {
  if (busyLabel !== null) return { busy: true, fraction: 0.1, label: busyLabel }
  const waiting = render.status !== 'error' && !resultIsCurrent
  return { busy: render.status === 'rendering' || waiting, fraction: render.fraction, label: render.stage || 'Starting' }
}

function frameStyle(original: ImageData, fitted: { width: number; height: number } | null): CSSProperties {
  if (fitted) return { width: fitted.width, height: fitted.height }
  return { aspectRatio: `${original.width} / ${original.height}`, width: '100%', maxHeight: '100%' }
}

function OriginalOverlay({ canvasRef, visible, picking, split }: { canvasRef: RefObject<HTMLCanvasElement | null>; visible: boolean; picking: boolean; split: number }) {
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 size-full ${visible ? '' : 'hidden'}`}
      style={{ clipPath: picking ? undefined : `inset(0 ${(1 - split) * 100}% 0 0)` }}
    />
  )
}

export function Stage({ original, result, resultIsCurrent, render, busyLabel, comparing, tool }: StageProps) {
  const stage = useRef<HTMLDivElement>(null)
  const fitted = useContainedSize(stage, original)
  const resultCanvas = useRef<HTMLCanvasElement>(null)
  const originalCanvas = useRef<HTMLCanvasElement>(null)
  const [split, setSplit] = useState(0.5)
  const { path, handlers } = useStageGesture(original, tool)
  const rendered = useMemo(() => resultImageData(result, original), [result, original])

  useEffect(() => paintCanvas(resultCanvas.current, rendered ?? original), [rendered, original])
  useEffect(() => paintCanvas(originalCanvas.current, original), [original])

  const picking = tool.kind === 'pick'
  const smearing = tool.kind === 'smear' && path.length > 1
  return (
    <div ref={stage} className="relative grid size-full place-items-center p-4 sm:p-8">
      <div
        className={`relative overflow-hidden rounded-[var(--radius-stage)] [box-shadow:var(--paint-shadow-stage)] ${tool.kind === 'none' ? '' : 'cursor-crosshair touch-none'}`}
        style={frameStyle(original, fitted)}
        {...handlers}
      >
        <canvas ref={resultCanvas} className="block size-full" />
        <OriginalOverlay canvasRef={originalCanvas} visible={comparing || picking} picking={picking} split={split} />
        {comparing && !picking && <CompareHandle split={split} onChange={setSplit} />}
        {smearing && <SmearPreview path={path} radius={tool.kind === 'smear' ? tool.radius : 0} width={original.width} height={original.height} />}
        <RenderVeil source={rendered ?? original} photo={original} {...busyState(render, busyLabel, resultIsCurrent)} />
      </div>
    </div>
  )
}

function CompareHandle({ split, onChange }: { split: number; onChange: (split: number) => void }) {
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.parentElement?.getBoundingClientRect()
    if (box) onChange(Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)))
  }
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Original versus painted"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(split * 100)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onChange(Math.max(0, split - 0.05))
        if (event.key === 'ArrowRight') onChange(Math.min(1, split + 0.05))
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        move(event)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event)
      }}
      className="absolute inset-y-0 w-10 -translate-x-1/2 cursor-ew-resize touch-none"
      style={{ left: `${split * 100}%` }}
    >
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[rgb(var(--paint-ink))] [box-shadow:0_0_8px_oklch(0_0_0/0.5)]" />
      <div className="absolute top-1/2 left-1/2 size-9 -translate-1/2 rounded-full bg-[rgb(var(--paint-ink))] [box-shadow:var(--paint-shadow-raised)]" />
    </div>
  )
}

function SmearPreview({ path, radius, width, height }: { path: SmudgePoint[]; radius: number; width: number; height: number }) {
  const points = path.map((p) => `${p.x},${p.y}`).join(' ')
  return (
    <svg aria-hidden viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 size-full">
      <polyline points={points} fill="none" stroke="oklch(1 0 0 / 0.35)" strokeWidth={radius * 2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
