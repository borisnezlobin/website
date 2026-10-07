import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { KnifeReveal } from '../lib/knifeReveal'
import { SmearAnimation } from '../lib/smearAnimation'

interface RenderVeilProps {
  source: ImageData
  photo: ImageData
  busy: boolean
  fraction: number
  label: string
}

type Phase = 'idle' | 'busy' | 'revealing'

interface Animations {
  smear: SmearAnimation | null
  reveal: KnifeReveal | null
}

interface Point {
  x: number
  y: number
}

const DRAG_ERASE_WIDTH = 0.14

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const VEIL_DELAY_MS = 450

function useSettledBusy(busy: boolean): boolean {
  const [wasBusy, setWasBusy] = useState(busy)
  const [episode, setEpisode] = useState(0)
  const [settledEpisode, setSettledEpisode] = useState(-1)
  if (wasBusy !== busy) {
    setWasBusy(busy)
    if (busy) setEpisode(episode + 1)
  }
  useEffect(() => {
    if (!busy) return
    const timer = window.setTimeout(() => setSettledEpisode(episode), VEIL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [busy, episode])
  return busy && settledEpisode === episode
}

function usePhase(busy: boolean): [Phase, () => void] {
  const [wasBusy, setWasBusy] = useState(busy)
  const [revealing, setRevealing] = useState(false)
  if (wasBusy !== busy) {
    setWasBusy(busy)
    setRevealing(!busy && !prefersReducedMotion())
  }
  const finishReveal = useCallback(() => setRevealing(false), [])
  const phase: Phase = busy ? 'busy' : revealing ? 'revealing' : 'idle'
  return [phase, finishReveal]
}

function loop(step: () => boolean): () => void {
  let frame = requestAnimationFrame(function tick() {
    if (step()) frame = requestAnimationFrame(tick)
  })
  return () => cancelAnimationFrame(frame)
}

function useVeilAnimation(canvas: RefObject<HTMLCanvasElement | null>, phase: Phase, source: ImageData, photo: ImageData, onRevealed: () => void): RefObject<Animations> {
  const animations = useRef<Animations>({ smear: null, reveal: null })
  const latestSource = useRef(source)
  const busy = phase === 'busy'

  useEffect(() => {
    latestSource.current = source
  }, [source])

  useEffect(() => {
    if (!busy || !canvas.current) return
    const smear = new SmearAnimation(canvas.current, latestSource.current)
    animations.current = { smear, reveal: null }
    if (prefersReducedMotion()) return
    return loop(() => {
      smear.frame()
      return true
    })
  }, [busy, photo, canvas])

  useEffect(() => {
    if (phase !== 'revealing' || !canvas.current) return
    const reveal = new KnifeReveal(canvas.current)
    animations.current = { smear: null, reveal }
    return loop(() => {
      reveal.frame()
      if (!reveal.finished) return true
      onRevealed()
      return false
    })
  }, [phase, canvas, onRevealed])

  return animations
}

function toCanvasPoint(event: PointerEvent<HTMLCanvasElement>): Point {
  const box = event.currentTarget.getBoundingClientRect()
  const scale = event.currentTarget.width / box.width
  return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale }
}

function useVeilDrag(animations: RefObject<Animations>) {
  const last = useRef<{ pointerId: number; point: Point } | null>(null)
  const swipe = (event: PointerEvent<HTMLCanvasElement>, to: Point) => {
    const from = last.current?.point ?? to
    const { smear, reveal } = animations.current
    smear?.smearAlong(from, to)
    reveal?.eraseAlong(from, to, event.currentTarget.width * DRAG_ERASE_WIDTH)
  }
  return {
    onPointerDown: (event: PointerEvent<HTMLCanvasElement>) => {
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      last.current = { pointerId: event.pointerId, point: toCanvasPoint(event) }
    },
    onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => {
      if (last.current?.pointerId !== event.pointerId) return
      const point = toCanvasPoint(event)
      swipe(event, point)
      last.current = { pointerId: event.pointerId, point }
    },
    onPointerUp: () => {
      last.current = null
    },
    onPointerCancel: () => {
      last.current = null
    },
  }
}

export function RenderVeil({ source, photo, busy: working, fraction, label }: RenderVeilProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const busy = useSettledBusy(working)
  const [phase, finishReveal] = usePhase(busy)
  const animations = useVeilAnimation(canvas, phase, source, photo, finishReveal)
  const drag = useVeilDrag(animations)

  useEffect(() => animations.current.smear?.setProgress(fraction), [fraction, animations])

  const active = phase !== 'idle'
  return (
    <div className={`absolute inset-0 transition-opacity duration-200 ease-[var(--ease-out-soft)] ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <canvas ref={canvas} aria-hidden className={`block size-full touch-none ${active ? 'cursor-grab active:cursor-grabbing' : ''}`} {...drag} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 transition-opacity duration-200 ${busy ? 'opacity-100' : 'opacity-0'}`}>
        <span role="status" className={`mx-4 rounded-full bg-[rgb(var(--paint-surface)/0.8)] px-3 py-1 text-sm font-medium text-[rgb(var(--paint-ink))] [box-shadow:var(--paint-shadow-raised)] backdrop-blur ${busy ? '' : 'invisible'}`}>
          {busy ? label : ''}
        </span>
        <span aria-hidden className="h-1 bg-[rgb(var(--paint-accent))] [box-shadow:0_0_12px_color-mix(in_oklch,var(--color-wet)_70%,transparent)] transition-[width] duration-300 ease-[var(--ease-out-soft)]" style={{ width: `${Math.max(4, fraction * 100)}%` }} />
      </div>
    </div>
  )
}
