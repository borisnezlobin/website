import { useRef, type KeyboardEvent, type PointerEvent } from 'react'

interface AngleDialProps {
  label: string
  angle: number
  onChange: (angle: number) => void
}

const SIZE = 56
const CENTER = SIZE / 2
const STEP = Math.PI / 36

function toDegrees(angle: number): number {
  return Math.round(((((angle * 180) / Math.PI) % 360) + 360) % 360)
}

const KEY_STEPS: Record<string, number> = { ArrowRight: STEP, ArrowUp: -STEP, ArrowLeft: -STEP, ArrowDown: STEP, PageUp: -STEP * 6, PageDown: STEP * 6 }

export function AngleDial({ label, angle, onChange }: AngleDialProps) {
  const dial = useRef<SVGSVGElement>(null)

  const angleFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const box = dial.current?.getBoundingClientRect()
    if (!box) return
    onChange(Math.atan2(event.clientY - (box.top + box.height / 2), event.clientX - (box.left + box.width / 2)))
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const delta = KEY_STEPS[event.key]
    if (delta === undefined) return
    event.preventDefault()
    onChange(angle + delta)
  }

  const tipX = CENTER + Math.cos(angle) * (CENTER - 9)
  const tipY = CENTER + Math.sin(angle) * (CENTER - 9)
  return (
    <div className="flex items-center gap-3">
      <svg
        ref={dial}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={toDegrees(angle)}
        aria-valuetext={`${toDegrees(angle)} degrees`}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="shrink-0 cursor-grab touch-none rounded-full bg-[rgb(var(--paint-surface))] [box-shadow:var(--paint-shadow-raised)] active:cursor-grabbing"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          angleFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) angleFromPointer(event)
        }}
        onKeyDown={onKeyDown}
      >
        <circle cx={CENTER} cy={CENTER} r={CENTER - 5} fill="none" stroke="var(--color-line)" strokeDasharray="1 5" strokeLinecap="round" />
        <line x1={CENTER} y1={CENTER} x2={tipX} y2={tipY} stroke="var(--color-accent)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={tipX} cy={tipY} r={4} fill="var(--color-ink)" />
        <circle cx={CENTER} cy={CENTER} r={3} fill="var(--color-ink-faint)" />
      </svg>
      <div className="flex flex-col">
        <span className="text-label">{label}</span>
        <span className="text-value">{toDegrees(angle)}°</span>
      </div>
    </div>
  )
}
