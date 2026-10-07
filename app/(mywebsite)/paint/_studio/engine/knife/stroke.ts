import type { Rgb } from '../color'
import { valueNoise1, valueNoise2 } from '../random'
import { clamp01, smoothstep, type Field } from '../raster'
import type { PaintCanvas } from './canvas'

export interface KnifeStroke {
  x: number
  y: number
  angle: number
  length: number
  width: number
  color: Rgb
  edgeColor: Rgb
  edgeMix: number
  load: number
  thickness: number
  seed: number
  residue?: Residue
  wetMix?: number
}

export interface Residue {
  color: Rgb
  amount: number
}

export interface StrokeClip {
  presence?: Field
  threshold: number
  edge?: EdgeLimit
}

export interface EdgeLimit {
  signedDistance: Field
  overhang: number
}

interface BladeFrame {
  cos: number
  sin: number
  halfLength: number
  halfWidth: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  scrape: number
  skew: number
  taper: number
  ridgeSide: number
}

function seededUnit(seed: number, salt: number): number {
  return valueNoise1((seed % 9973) + salt * 0.37, salt)
}

function bladeFrame(stroke: KnifeStroke, canvas: PaintCanvas): BladeFrame {
  const cos = Math.cos(stroke.angle)
  const sin = Math.sin(stroke.angle)
  const halfLength = stroke.length / 2
  const skew = (seededUnit(stroke.seed, 1) - 0.5) * 0.8
  const taper = (seededUnit(stroke.seed, 2) - 0.5) * 0.7
  const reachAlong = halfLength * 1.2
  const reachAcross = (stroke.width / 2) * (1 + Math.abs(taper)) * 1.06 * 1.6 + (stroke.width / 2) * Math.abs(skew) * 1.2
  const extentX = Math.abs(cos) * reachAlong + Math.abs(sin) * reachAcross + 3
  const extentY = Math.abs(sin) * reachAlong + Math.abs(cos) * reachAcross + 3
  return {
    cos,
    sin,
    halfLength,
    halfWidth: stroke.width / 2,
    minX: Math.max(0, Math.floor(stroke.x - extentX)),
    maxX: Math.min(canvas.width - 1, Math.ceil(stroke.x + extentX)),
    minY: Math.max(0, Math.floor(stroke.y - extentY)),
    maxY: Math.min(canvas.height - 1, Math.ceil(stroke.y + extentY)),
    scrape: seededUnit(stroke.seed, 3) * 0.55,
    skew,
    taper,
    ridgeSide: seededUnit(stroke.seed, 4) < 0.5 ? -1 : 1,
  }
}

function bladeShape(u: number, v: number, frame: BladeFrame, seed: number): number {
  const progress = (u + 1) / 2
  const chipped = 0.05 + 0.22 * (1 - progress)
  const lengthEdge = 1 + chipped * (valueNoise1(v * 3.1 + 3, seed) - 0.5)
  const widthEdge = (1 + frame.taper * u) * (1 + 0.08 * (valueNoise1(u * 2.8 + 9, seed + 1) - 0.5))
  const insideLength = (lengthEdge - Math.abs(u)) * frame.halfLength
  const insideWidth = (widthEdge - Math.abs(v)) * frame.halfWidth
  return clamp01(Math.min(insideLength, insideWidth) + 0.5)
}

export interface KnifeTexture {
  striation: number
  marble: number
  bodyThickness: number
}

export function knifeTexture(acrossPixels: number, u: number, v: number, seed: number, halfWidth: number, ridgeSide: number): KnifeTexture {
  const fine = valueNoise2(acrossPixels / 0.9, u * 0.8, seed + 4)
  const medium = valueNoise1(acrossPixels / 3.2, seed + 6)
  const marble = valueNoise2(acrossPixels / Math.max(2, halfWidth * 0.45), u * 1.3, seed + 8)
  const ridge = smoothstep(0.6, 1, v * ridgeSide)
  return {
    striation: 0.55 * fine + 0.45 * medium,
    marble,
    bodyThickness: 0.55 + 0.3 * ridge + 0.07 * medium,
  }
}

interface PaintSample {
  progress: number
  across: number
  texture: KnifeTexture
  alpha: number
}

const EMPTY_BLADE = 0.15
const CONTACT_RANGE = 0.5
const CONTACT_SOFTNESS = 0.05
const HIDING_POWER = 4

function thicknessAt(canvas: PaintCanvas, index: number): number {
  const layer = canvas.layer
  const own = canvas.thickness.data[index]
  return layer ? own + layer.thicknessWeight.data[index] * layer.groundThickness.data[index] : own
}

function wetPaintAt(canvas: PaintCanvas, index: number): number {
  const own = canvas.paint.data[index]
  return canvas.layer ? Math.max(own, canvas.layer.groundPaint.data[index]) : own
}

function surfaceHeight(canvas: PaintCanvas, index: number, tooth: number): number {
  const ridges = Math.min(1, thicknessAt(canvas, index) / 1.2)
  return 0.6 * tooth + 0.4 * ridges
}

function trackLayerWeights(canvas: PaintCanvas, index: number, alpha: number, pickup: number): void {
  const layer = canvas.layer
  if (!layer) return
  layer.colorWeight.data[index] *= 1 - alpha + alpha * pickup
  layer.thicknessWeight.data[index] *= 1 - 0.7 * alpha
}

function paintCoverage(stroke: KnifeStroke, progress: number, texture: KnifeTexture, surface: number): number {
  const remaining = stroke.load - 0.85 * progress
  const reach = (remaining - EMPTY_BLADE) / CONTACT_RANGE - 0.35 * (texture.striation - 0.5)
  const contact = smoothstep(-CONTACT_SOFTNESS, CONTACT_SOFTNESS, reach - (1 - surface))
  const hiding = 1 - Math.exp(-HIDING_POWER * (0.25 + clamp01(reach)))
  return contact * hiding
}

function edgeCoverage(edge: EdgeLimit | undefined, index: number): number {
  if (!edge) return 1
  return clamp01(edge.overhang - edge.signedDistance.data[index] + 0.5)
}

function clipCoverage(clip: StrokeClip | undefined, index: number): number {
  if (!clip) return 1
  const present = clip.presence ? smoothstep(clip.threshold - 0.08, clip.threshold + 0.08, clip.presence.data[index]) : 1
  return present * edgeCoverage(clip.edge, index)
}

export function rasterizeStroke(canvas: PaintCanvas, stroke: KnifeStroke, clip?: StrokeClip): void {
  const frame = bladeFrame(stroke, canvas)
  for (let py = frame.minY; py <= frame.maxY; py++) {
    for (let px = frame.minX; px <= frame.maxX; px++) {
      const index = py * canvas.width + px
      const clipped = clipCoverage(clip, index)
      if (clipped <= 0) continue
      const dx = px + 0.5 - stroke.x
      const dy = py + 0.5 - stroke.y
      const u = (dx * frame.cos + dy * frame.sin) / frame.halfLength
      const v = (-dx * frame.sin + dy * frame.cos) / frame.halfWidth - frame.skew * u
      if (Math.abs(u) > 1.2 || Math.abs(v) > 2) continue
      const shape = bladeShape(u, v, frame, stroke.seed)
      if (shape <= 0) continue
      const progress = (u + 1) / 2
      const texture = knifeTexture(v * frame.halfWidth, u, v, stroke.seed, frame.halfWidth, frame.ridgeSide)
      const tooth = canvas.tooth.data[index]
      const scrapeThrough = frame.scrape * smoothstep(0.75, 0.9, texture.striation) * (1 - smoothstep(0.5, 0.9, Math.abs(v)))
      const alpha = shape * clipped * paintCoverage(stroke, progress, texture, surfaceHeight(canvas, index, tooth)) * (1 - scrapeThrough)
      if (alpha <= 0.002) continue
      depositPaint(canvas, index, stroke, { progress, across: v, texture, alpha })
    }
  }
}

function residueWeight(residue: Residue | undefined, sample: PaintSample): number {
  if (!residue) return 0
  const nearEdge = smoothstep(0.35, 0.9, Math.abs(sample.across))
  const early = 1 - smoothstep(0.05, 0.75, sample.progress)
  return residue.amount * nearEdge * early * (0.4 + 0.6 * sample.texture.marble)
}

function pigmentAt(stroke: KnifeStroke, sample: PaintSample, channel: number): number {
  const marbled = stroke.edgeMix * smoothstep(0.42, 0.72, sample.texture.marble)
  const base = stroke.color[channel] + (stroke.edgeColor[channel] - stroke.color[channel]) * marbled
  const residue = stroke.residue
  return residue ? base + (residue.color[channel] - base) * residueWeight(residue, sample) : base
}

function depositPaint(canvas: PaintCanvas, index: number, stroke: KnifeStroke, sample: PaintSample): void {
  const { data } = canvas.color
  const { texture } = sample
  const shade = 1 + (texture.striation - 0.5) * 0.045
  const under = index * 3
  const wetPaintBelow = wetPaintAt(canvas, index)
  const streak = 0.3 + 1.4 * smoothstep(0.35, 0.65, texture.marble)
  const pickup = Math.min(1, Math.max(0.3 * (1 - smoothstep(0, 0.35, sample.progress)), stroke.wetMix ?? 0) * wetPaintBelow * streak)
  for (let c = 0; c < 3; c++) {
    const pigment = pigmentAt(stroke, sample, c) * shade
    const mixed = pigment + (data[under + c] - pigment) * pickup
    data[under + c] += (mixed - data[under + c]) * sample.alpha
  }
  const lip = smoothstep(0.85, 1, sample.progress) * 0.5
  const layer = stroke.thickness * (texture.bodyThickness + lip)
  const previous = canvas.thickness.data[index]
  canvas.thickness.data[index] = previous + (previous * 0.3 + layer - previous) * sample.alpha
  canvas.paint.data[index] = Math.max(canvas.paint.data[index], sample.alpha)
  trackLayerWeights(canvas, index, sample.alpha, pickup)
}
