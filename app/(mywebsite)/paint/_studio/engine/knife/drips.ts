import type { Rgb } from '../color'
import { oklchToSrgb, srgbToOklch } from '../color'
import { createRandom, valueNoise1, type Random } from '../random'
import { clamp01 } from '../raster'
import type { PaintCanvas } from './canvas'
import type { KnifeStroke } from './stroke'

export interface DripPlan {
  amount: number
  length: number
  width: number
  seed: number
  isProtected: (x: number, y: number) => boolean
  canStart?: (x: number, y: number) => boolean
}

interface Drip {
  x: number
  y: number
  volume: number
  width: number
  film: number
  color: Rgb
  opacity: number
  seed: number
}

function wetColor(color: Rgb): Rgb {
  const [lightness, chroma, hue] = srgbToOklch(color)
  return oklchToSrgb([lightness * 0.93, chroma * 1.1, hue])
}

function canvasColorAt(canvas: PaintCanvas, x: number, y: number): Rgb {
  const index = (Math.round(y) * canvas.width + Math.round(x)) * 3
  return [canvas.color.data[index], canvas.color.data[index + 1], canvas.color.data[index + 2]]
}

interface DripSource {
  x: number
  y: number
}

interface LoadedCorner extends DripSource {
  colour: Rgb
  load: number
}

const LOADED_END_INSET = 1.5
const VISIBLE_TOLERANCE = 0.05
const EXPOSED_GAP = 0.08
const BUILDUP_THICKNESS = 0.45

interface LoadedEnd extends LoadedCorner {
  alongEdge: DripSource
}

function loadedCorner(stroke: KnifeStroke): LoadedEnd {
  const cos = Math.cos(stroke.angle)
  const sin = Math.sin(stroke.angle)
  const along = -stroke.length / 2 + LOADED_END_INSET
  const across = stroke.width / 2 - LOADED_END_INSET
  const corners = [-1, 1].map((side) => ({ x: stroke.x + cos * along - sin * across * side, y: stroke.y + sin * along + cos * across * side }))
  const lower = corners[0].y > corners[1].y ? corners[0] : corners[1]
  const centre = { x: stroke.x + cos * along, y: stroke.y + sin * along }
  return { x: lower.x, y: lower.y, colour: stroke.color, load: stroke.load, alongEdge: { x: (lower.x + centre.x) / 2, y: (lower.y + centre.y) / 2 } }
}

function startsLow(stroke: KnifeStroke): boolean {
  return Math.sin(stroke.angle) < 0.35
}

function colourGap(a: Rgb, b: Rgb): number {
  return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3
}

function insideCanvas(canvas: PaintCanvas, point: DripSource): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < canvas.width - 1 && point.y < canvas.height - 5
}

function showsColour(canvas: PaintCanvas, point: DripSource, colour: Rgb): boolean {
  return colourGap(canvasColorAt(canvas, point.x, point.y), colour) < VISIBLE_TOLERANCE
}

function hasBuildup(canvas: PaintCanvas, corner: LoadedEnd): boolean {
  return canvas.thickness.data[Math.round(corner.y) * canvas.width + Math.round(corner.x)] >= BUILDUP_THICKNESS
}

function edgeExposedBelow(canvas: PaintCanvas, corner: LoadedEnd): boolean {
  return colourGap(canvasColorAt(canvas, corner.x, corner.y + LOADED_END_INSET + 3), corner.colour) > EXPOSED_GAP
}

function canDrip(canvas: PaintCanvas, corner: LoadedEnd): boolean {
  if (!insideCanvas(canvas, corner) || !insideCanvas(canvas, corner.alongEdge)) return false
  return showsColour(canvas, corner, corner.colour) && showsColour(canvas, corner.alongEdge, corner.colour) && hasBuildup(canvas, corner) && edgeExposedBelow(canvas, corner)
}

function dripSources(canvas: PaintCanvas, strokes: KnifeStroke[], plan: DripPlan): LoadedCorner[] {
  return strokes
    .filter((stroke) => stroke.load >= 1.1 && stroke.width >= plan.width * 2 && startsLow(stroke))
    .map(loadedCorner)
    .filter((corner) => canDrip(canvas, corner) && !plan.isProtected(Math.round(corner.x), Math.round(corner.y)) && (plan.canStart?.(corner.x, corner.y) ?? true))
}

function spawnDrip(source: LoadedCorner, plan: DripPlan, canvasHeight: number, random: Random): Drip {
  const load = Math.min(1.6, source.load)
  const run = plan.length * canvasHeight * (load - 0.6) * Math.exp(random.gaussian() * 0.5)
  const width = plan.width * random.range(0.7, 1.35)
  const thin = random.next() < 0.25
  return {
    x: source.x,
    y: Math.round(source.y),
    volume: Math.max(width * 4, run * width),
    width,
    film: random.range(0.85, 1.15),
    color: wetColor(source.colour),
    opacity: thin ? random.range(0.45, 0.7) : random.range(0.85, 0.97),
    seed: random.int(1 << 30),
  }
}

function paintSpan(canvas: PaintCanvas, centerX: number, y: number, width: number, drip: Drip, isProtected: DripPlan['isProtected']): void {
  if (y < 0 || y >= canvas.height) return
  const half = width / 2
  for (let px = Math.floor(centerX - half - 1); px <= Math.ceil(centerX + half + 1); px++) {
    if (px < 0 || px >= canvas.width || isProtected(px, y)) continue
    const offset = (px + 0.5 - centerX) / Math.max(half, 0.5)
    const alpha = clamp01(half - Math.abs(px + 0.5 - centerX) + 0.5) * drip.opacity
    if (alpha <= 0) continue
    const index = y * canvas.width + px
    for (let c = 0; c < 3; c++) canvas.color.data[index * 3 + c] += (drip.color[c] - canvas.color.data[index * 3 + c]) * alpha
    const bulge = Math.sqrt(Math.max(0, 1 - offset * offset))
    canvas.thickness.data[index] = Math.max(canvas.thickness.data[index], canvas.thickness.data[index] * (1 - alpha) + bulge * Math.min(width, 6) * 0.3)
  }
}

function paintBead(canvas: PaintCanvas, x: number, y: number, width: number, drip: Drip, isProtected: DripPlan['isProtected']): void {
  const radiusX = width * 0.75
  const radiusY = width * 1.05
  for (let row = Math.floor(-radiusY); row <= Math.ceil(radiusY); row++) {
    const span = 2 * radiusX * Math.sqrt(Math.max(0, 1 - (row / radiusY) ** 2))
    if (span > 0.3) paintSpan(canvas, x, Math.round(y + row), span, drip, isProtected)
  }
}

function footprintProtected(plan: DripPlan, x: number, y: number, width: number): boolean {
  return plan.isProtected(x - width, y) || plan.isProtected(x, y) || plan.isProtected(x + width, y)
}

function flowDrip(canvas: PaintCanvas, drip: Drip, plan: DripPlan): void {
  let x = drip.x
  let y = drip.y
  paintBead(canvas, x, y, drip.width * 0.75, drip, plan.isProtected)
  let volume = drip.volume
  while (volume > 0 && y < canvas.height - 1) {
    const fullness = volume / drip.volume
    const swell = 0.82 + 0.36 * valueNoise1(y / 23, drip.seed + 3)
    const width = drip.width * (0.6 + 0.4 * Math.sqrt(fullness)) * swell
    paintSpan(canvas, x, Math.round(y), width, drip, plan.isProtected)
    volume -= width * drip.film
    y += 1
    x += (valueNoise1(y / 60, drip.seed) - 0.5) * 0.12
    if (footprintProtected(plan, x, y + drip.width, drip.width)) break
  }
  paintBead(canvas, x, y, drip.width * 0.85, drip, plan.isProtected)
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = random.int(i + 1)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

const FULL_DRIP_AMOUNT = 1.5

export function runDrips(canvas: PaintCanvas, strokes: KnifeStroke[], plan: DripPlan): number {
  if (plan.amount <= 0) return 0
  const random = createRandom(plan.seed + 500)
  const sources = shuffle(dripSources(canvas, strokes, plan), random)
  const chosen = sources.slice(0, Math.round(sources.length * Math.min(1, plan.amount / FULL_DRIP_AMOUNT)))
  for (const source of chosen) flowDrip(canvas, spawnDrip(source, plan, canvas.height, random), plan)
  return chosen.length
}

const DIRT_DRIP_SHARE = 0.4
const DIRT_DRIP_LENGTH = 0.6

export function runDirtDrips(canvas: PaintCanvas, dabs: KnifeStroke[], plan: DripPlan): number {
  if (plan.amount <= 0) return 0
  const random = createRandom(plan.seed + 700)
  const shorter = { ...plan, length: plan.length * DIRT_DRIP_LENGTH, width: plan.width * 0.8 }
  const sources = dripSources(canvas, dabs.map((dab) => ({ ...dab, load: Math.max(dab.load, 1.2) })), { ...shorter, width: 0 })
  const chosen = sources.filter(() => random.next() < DIRT_DRIP_SHARE * Math.min(1, plan.amount * 1.5))
  for (const source of chosen) flowDrip(canvas, spawnDrip(source, shorter, canvas.height, random), shorter)
  return chosen.length
}
