const LANES = 7
const BANDS = 6
const BAND_STAGGER_MS = 140
const BAND_TRAVEL_MS = 760
const BAND_OVERLAP = 1.3

export const REVEAL_DURATION_MS = (BANDS - 1) * BAND_STAGGER_MS + BAND_TRAVEL_MS

interface Lane {
  offset: number
  pace: number
  strength: number
}

interface Band {
  across: number
  delay: number
  reached: number
  lanes: Lane[]
}

interface Point {
  x: number
  y: number
}

function between(low: number, high: number): number {
  return low + Math.random() * (high - low)
}

function knifeEase(t: number): number {
  return t * t * (3 - 2 * t)
}

function bandOrder(): number[] {
  const order = Array.from({ length: BANDS }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    if (Math.random() < 0.35) [order[i], order[i - 1]] = [order[i - 1], order[i]]
  }
  return order
}

function laneSet(width: number): Lane[] {
  return Array.from({ length: LANES }, (_, index) => ({
    offset: -width / 2 + (index + 0.5) * (width / LANES),
    pace: between(0.9, 1.08),
    strength: Math.random() < 0.18 ? between(0.55, 0.8) : 1,
  }))
}

export class KnifeReveal {
  private readonly context: CanvasRenderingContext2D | null
  private readonly angle = Math.random() * Math.PI * 2
  private readonly dir: Point
  private readonly normal: Point
  private readonly reach: number
  private readonly bandWidth: number
  private readonly bands: Band[]
  private readonly started = performance.now()

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')
    this.dir = { x: Math.cos(this.angle), y: Math.sin(this.angle) }
    this.normal = { x: -this.dir.y, y: this.dir.x }
    this.reach = Math.hypot(canvas.width, canvas.height)
    this.bandWidth = (this.reach / BANDS) * BAND_OVERLAP
    this.bands = bandOrder().map((slot, index) => ({
      across: -this.reach / 2 + (slot + 0.5) * (this.reach / BANDS),
      delay: index * BAND_STAGGER_MS,
      reached: 0,
      lanes: laneSet(this.bandWidth),
    }))
  }

  get finished(): boolean {
    return performance.now() - this.started >= REVEAL_DURATION_MS
  }

  frame(): void {
    if (!this.context) return
    const elapsed = performance.now() - this.started
    for (const band of this.bands) this.advance(this.context, band, elapsed)
  }

  eraseAlong(from: Point, to: Point, width: number): void {
    if (!this.context) return
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    if (length < 0.5) return
    const along = { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
    const across = { x: -along.y, y: along.x }
    this.context.save()
    this.context.globalCompositeOperation = 'destination-out'
    for (const lane of laneSet(width)) {
      this.context.globalAlpha = lane.strength
      this.fillQuad(this.context, from, to, across, lane.offset, width / LANES + 0.6)
    }
    this.context.restore()
  }

  private advance(context: CanvasRenderingContext2D, band: Band, elapsed: number): void {
    const progress = knifeEase(Math.min(1, Math.max(0, (elapsed - band.delay) / BAND_TRAVEL_MS)))
    if (progress <= band.reached) return
    context.save()
    context.globalCompositeOperation = 'destination-out'
    for (const lane of band.lanes) this.eraseLaneSegment(context, band, lane, progress)
    context.restore()
    band.reached = progress
  }

  private eraseLaneSegment(context: CanvasRenderingContext2D, band: Band, lane: Lane, progress: number): void {
    const from = this.pointOnBand(band, Math.min(1, band.reached * lane.pace))
    const to = this.pointOnBand(band, Math.min(1, progress * lane.pace + (progress >= 1 ? 0.1 : 0)))
    context.globalAlpha = lane.strength
    this.fillQuad(context, from, to, this.normal, lane.offset, this.bandWidth / LANES + 0.6)
  }

  private pointOnBand(band: Band, travel: number): Point {
    const along = -this.reach / 2 + travel * this.reach
    return {
      x: this.canvas.width / 2 + this.dir.x * along + this.normal.x * band.across,
      y: this.canvas.height / 2 + this.dir.y * along + this.normal.y * band.across,
    }
  }

  private fillQuad(context: CanvasRenderingContext2D, from: Point, to: Point, across: Point, offset: number, width: number): void {
    const near = offset - width / 2
    const far = offset + width / 2
    context.beginPath()
    context.moveTo(from.x + across.x * near, from.y + across.y * near)
    context.lineTo(from.x + across.x * far, from.y + across.y * far)
    context.lineTo(to.x + across.x * far, to.y + across.y * far)
    context.lineTo(to.x + across.x * near, to.y + across.y * near)
    context.closePath()
    context.fill()
  }
}
