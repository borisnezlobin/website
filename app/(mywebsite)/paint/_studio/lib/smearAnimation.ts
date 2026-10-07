const MAX_SIDE = 512
const NICKS = 7
const STEPS_PER_FRAME = 3
const RE_INK = 0.004
const SPAWN_CHANCE = 0.4
const DRAG_STEP = 0.02
const DRAG_WIDTH = 0.1

interface Blade {
  x: number
  y: number
  dx: number
  dy: number
  width: number
  length: number
  step: number
  travelled: number
  nicks: number[]
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

function between(low: number, high: number): number {
  return low + Math.random() * (high - low)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function scaledCopy(image: ImageData, width: number, height: number): HTMLCanvasElement {
  const full = createCanvas(image.width, image.height)
  full.getContext('2d')?.putImageData(image, 0, 0)
  const scaled = createCanvas(width, height)
  scaled.getContext('2d')?.drawImage(full, 0, 0, width, height)
  return scaled
}

function bladeNicks(): number[] {
  return Array.from({ length: NICKS }, () => (Math.random() < 0.15 ? 0 : between(0.6, 1)))
}

function stripCorners(blade: Blade, lane: number): [number, number][] {
  const across = blade.width / NICKS
  const offset = -blade.width / 2 + lane * across
  const startX = blade.x + blade.dx * blade.travelled
  const startY = blade.y + blade.dy * blade.travelled
  const normalX = -blade.dy
  const normalY = blade.dx
  const along = blade.step + 1
  return [
    [startX + normalX * offset, startY + normalY * offset],
    [startX + normalX * (offset + across + 0.5), startY + normalY * (offset + across + 0.5)],
    [startX + normalX * (offset + across + 0.5) + blade.dx * along, startY + normalY * (offset + across + 0.5) + blade.dy * along],
    [startX + normalX * offset + blade.dx * along, startY + normalY * offset + blade.dy * along],
  ]
}

function boundsOf(corners: [number, number][]): Box {
  const xs = corners.map(([x]) => x)
  const ys = corners.map(([, y]) => y)
  const x = Math.floor(Math.min(...xs))
  const y = Math.floor(Math.min(...ys))
  return { x, y, width: Math.ceil(Math.max(...xs)) - x + 1, height: Math.ceil(Math.max(...ys)) - y + 1 }
}

export class SmearAnimation {
  private readonly context: CanvasRenderingContext2D | null
  private readonly source: HTMLCanvasElement
  private readonly drift = Math.random() * Math.PI * 2
  private blades: Blade[] = []
  private intensity = 0

  constructor(private readonly canvas: HTMLCanvasElement, image: ImageData) {
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    this.source = scaledCopy(image, canvas.width, canvas.height)
    this.context = canvas.getContext('2d')
    this.context?.drawImage(this.source, 0, 0)
  }

  smearAlong(from: { x: number; y: number }, to: { x: number; y: number }): void {
    if (!this.context) return
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    if (distance < 0.5) return
    const size = Math.max(this.canvas.width, this.canvas.height)
    const step = Math.min(distance, size * DRAG_STEP)
    const blade: Blade = { x: from.x, y: from.y, dx: (to.x - from.x) / distance, dy: (to.y - from.y) / distance, width: size * DRAG_WIDTH, length: distance, step, travelled: 0, nicks: bladeNicks() }
    while (blade.travelled < distance) {
      for (let lane = 0; lane < NICKS; lane++) this.carryStrip(this.context, blade, lane, 0.9 * blade.nicks[lane])
      blade.travelled += step
    }
  }

  setProgress(fraction: number): void {
    this.intensity = clamp01(fraction)
  }

  frame(): void {
    if (!this.context) return
    this.reInk(this.context)
    this.spawnBlades()
    for (const blade of this.blades) this.drag(this.context, blade)
    this.blades = this.blades.filter((blade) => blade.travelled < blade.length)
  }

  private reInk(context: CanvasRenderingContext2D): void {
    context.globalAlpha = RE_INK
    context.drawImage(this.source, 0, 0)
  }

  private spawnBlades(): void {
    const wanted = 5 + Math.ceil(this.intensity * 6)
    if (this.blades.length >= wanted || Math.random() > SPAWN_CHANCE + this.intensity * 0.1) return
    this.blades.push(this.newBlade())
  }

  private newBlade(): Blade {
    const size = Math.max(this.canvas.width, this.canvas.height)
    const crosswise = Math.random() < 0.25 ? Math.PI / 2 : 0
    const angle = this.drift + crosswise + between(-0.5, 0.5)
    return {
      x: between(0, this.canvas.width),
      y: between(0, this.canvas.height),
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      width: size * between(0.08, 0.3),
      length: size * between(0.25, 0.7),
      step: size * between(0.006, 0.011),
      travelled: 0,
      nicks: bladeNicks(),
    }
  }

  private drag(context: CanvasRenderingContext2D, blade: Blade): void {
    for (let step = 0; step < STEPS_PER_FRAME && blade.travelled < blade.length; step++) {
      const pressure = Math.sin(Math.PI * clamp01(blade.travelled / blade.length))
      for (let lane = 0; lane < NICKS; lane++) this.carryStrip(context, blade, lane, pressure * blade.nicks[lane])
      blade.travelled += blade.step
    }
  }

  private carryStrip(context: CanvasRenderingContext2D, blade: Blade, lane: number, alpha: number): void {
    if (alpha <= 0.02) return
    const corners = stripCorners(blade, lane)
    const box = boundsOf(corners)
    const fromX = box.x - blade.dx * blade.step
    const fromY = box.y - blade.dy * blade.step
    if (fromX < 0 || fromY < 0 || fromX + box.width > this.canvas.width || fromY + box.height > this.canvas.height) return
    context.save()
    context.beginPath()
    corners.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)))
    context.closePath()
    context.clip()
    context.globalAlpha = alpha
    context.drawImage(this.canvas, fromX, fromY, box.width, box.height, box.x, box.y, box.width, box.height)
    context.restore()
  }
}
