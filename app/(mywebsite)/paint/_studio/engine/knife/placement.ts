import { oklchToSrgb, srgbToOklch, type Rgb } from '../color'
import { distanceToMask, edgeTangentField, gaussianBlurField, sobel } from '../filters'
import { createRandom, fractalNoise2, type Random } from '../random'
import { clamp01, createField, createImage, luminance, sampleFieldBilinear, sampleImageBilinear, smoothstep, type Field, type RgbImage } from '../raster'
import type { PaintCanvas } from './canvas'
import { DirtyKnife, paintStrayDabs, type StrayDabPlan } from './dirt'
import type { FaceZones } from './faces'
import { detailMapFor, FACE_IMPORTANCE, type DetailMap } from './importance'
import { kuwahara, summedTables, type SummedTables } from './kuwahara'
import { expressiveColor, mixRgb, type ColorStyle } from './palette'
import { rasterizeStroke, type KnifeStroke, type StrokeClip } from './stroke'

export interface SubjectPaintingPlan {
  source: RgbImage
  graded: RgbImage
  mask: Field
  baseSize: number
  detail: number
  style: ColorStyle
  dirt: number
  seed: number
  faces: FaceZones | null
}

interface PaintLayer {
  sizeFactor: number
  errorThreshold: number
  coverage: number
  minImportance: number
}

const LAYERS: PaintLayer[] = [
  { sizeFactor: 3.4, errorThreshold: 0, coverage: 1, minImportance: 0 },
  { sizeFactor: 2.0, errorThreshold: 0.05, coverage: 0.95, minImportance: 0 },
  { sizeFactor: 1.2, errorThreshold: 0.075, coverage: 0.9, minImportance: 0 },
  { sizeFactor: 0.75, errorThreshold: 0.06, coverage: 0.9, minImportance: 0.3 },
  { sizeFactor: 0.5, errorThreshold: 0.05, coverage: 0.9, minImportance: 0.55 },
  { sizeFactor: 0.32, errorThreshold: 0.04, coverage: 0.95, minImportance: 0.85 },
]

const STRAY_DAB_LAYER = 3
const COLOUR_RADIUS_PER_SIZE = 0.3
const HAIR_STROKE = 0.5

export interface HeadRegion {
  top: number
  bottom: number
  left: number
  right: number
}

interface Analysis {
  doubledCos: Field
  doubledSin: Field
  coherence: Field
  presence: Field
  signedDistance: Field
  detail: DetailMap
  baseSize: number
  unguided: boolean
}

function analysisHairLimit(analysis: Analysis): number {
  return analysis.baseSize * 1.25
}

function maskBounds(mask: Field): HeadRegion {
  let top = mask.height
  let bottom = 0
  let left = mask.width
  let right = 0
  for (let y = 0; y < mask.height; y += 2) {
    for (let x = 0; x < mask.width; x += 2) {
      if (mask.data[y * mask.width + x] < 0.5) continue
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
      left = Math.min(left, x)
      right = Math.max(right, x)
    }
  }
  return { top, bottom, left, right }
}

function headRegion(mask: Field): HeadRegion {
  const bounds = maskBounds(mask)
  const height = Math.max(1, bounds.bottom - bounds.top)
  const bottom = bounds.top + height * 0.42
  let left = mask.width
  let right = 0
  for (let y = bounds.top; y < bottom; y += 2) {
    for (let x = 0; x < mask.width; x += 2) {
      if (mask.data[y * mask.width + x] < 0.5) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
    }
  }
  const inset = (right - left) * 0.12
  return { top: bounds.top, bottom, left: left + inset, right: right - inset }
}

function isSkin(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
  return y > 50 && cr > 135 && cr < 180 && cb > 80 && cb < 135
}

function percentile(values: number[], fraction: number): number {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))]
}

function skinBox(image: RgbImage, mask: Field, bounds: HeadRegion): HeadRegion | null {
  const xs: number[] = []
  const ys: number[] = []
  const limit = bounds.top + (bounds.bottom - bounds.top) * 0.7
  for (let y = bounds.top; y < limit; y += 2) {
    for (let x = bounds.left; x <= bounds.right; x += 2) {
      const i = y * mask.width + x
      if (mask.data[i] < 0.5) continue
      if (isSkin(image.data[i * 3] * 255, image.data[i * 3 + 1] * 255, image.data[i * 3 + 2] * 255)) {
        xs.push(x)
        ys.push(y)
      }
    }
  }
  if (xs.length < 400) return null
  const left = percentile(xs, 0.05)
  const right = percentile(xs, 0.95)
  const top = percentile(ys, 0.03)
  const bottom = percentile(ys, 0.92)
  const padX = (right - left) * 0.12
  const padY = (bottom - top) * 0.1
  return { top: top - padY, bottom: bottom + padY, left: left - padX, right: right + padX }
}

export function faceRegionOf(image: RgbImage, mask: Field): HeadRegion {
  return skinBox(image, mask, maskBounds(mask)) ?? headRegion(mask)
}

export function inHead(head: HeadRegion, x: number, y: number): boolean {
  return y >= head.top && y <= head.bottom && x >= head.left && x <= head.right
}

const FADE_START = 0.78
const FADE_DEPTH = 0.3

interface BottomFade {
  dissolve: number
  baseSize: number
  seed: number
}

function raggedBottomLine(fade: BottomFade, bounds: HeadRegion, x: number): number {
  const span = Math.max(1, bounds.bottom - bounds.top)
  const ragged = fractalNoise2(x / (fade.baseSize * 4), 0.5, fade.seed + 3, 3)
  const bite = fade.dissolve * FADE_DEPTH * (0.2 + 1.6 * ragged)
  return bounds.top + span * (FADE_START + (1 - FADE_START) * (1 - fade.dissolve) - bite + fade.dissolve * 0.1)
}

export function fadeOutBottom(mask: Field, fade: BottomFade): Field {
  const faded = createField(mask.width, mask.height)
  faded.data.set(mask.data)
  if (fade.dissolve <= 0) return faded
  const bounds = maskBounds(mask)
  for (let x = 0; x < mask.width; x++) {
    const line = raggedBottomLine(fade, bounds, x)
    for (let y = Math.max(0, Math.floor(line - 2)); y < mask.height; y++) faded.data[y * mask.width + x] *= clamp01(line - y + 0.5)
  }
  return faded
}

function signedDistance(mask: Field): Field {
  const inside = createField(mask.width, mask.height)
  for (let i = 0; i < inside.data.length; i++) inside.data[i] = mask.data[i] >= 0.5 ? 0 : 1
  const toSubject = distanceToMask(mask)
  const toOutside = distanceToMask(inside)
  const field = createField(mask.width, mask.height)
  for (let i = 0; i < field.data.length; i++) field.data[i] = mask.data[i] >= 0.5 ? -toOutside.data[i] : toSubject.data[i]
  return field
}

function presenceField(plan: SubjectPaintingPlan, detail: DetailMap): Field {
  const soft = gaussianBlurField(plan.mask, Math.max(1, plan.baseSize * 0.5))
  const presence = createField(soft.width, soft.height)
  const scale = plan.baseSize * 5
  for (let y = 0; y < soft.height; y++) {
    for (let x = 0; x < soft.width; x++) {
      const i = y * soft.width + x
      const ragged = fractalNoise2(x / scale, y / scale, plan.seed + 3, 3)
      const band = 4 * soft.data[i] * (1 - soft.data[i])
      const protectedEdge = 1 - 0.6 * clamp01(detail.importance.data[i] / FACE_IMPORTANCE)
      const contour = soft.data[i] + (ragged - 0.5) * 0.5 * band * protectedEdge
      presence.data[i] = clamp01(contour)
    }
  }
  return presence
}

function analyse(plan: SubjectPaintingPlan): Analysis {
  const luma = luminance(plan.source)
  const orientation = edgeTangentField(luma, plan.baseSize * 0.6)
  const doubledCos = createField(luma.width, luma.height)
  const doubledSin = createField(luma.width, luma.height)
  for (let i = 0; i < luma.data.length; i++) {
    doubledCos.data[i] = Math.cos(2 * orientation.angle.data[i])
    doubledSin.data[i] = Math.sin(2 * orientation.angle.data[i])
  }
  const detail = detailMapFor(plan.source, plan.mask, plan.faces, faceRegionOf(plan.source, plan.mask), plan.baseSize)
  return { doubledCos, doubledSin, coherence: orientation.coherence, presence: presenceField(plan, detail), signedDistance: signedDistance(plan.mask), detail, baseSize: plan.baseSize, unguided: plan.faces === null }
}

function flowAngle(analysis: Analysis, x: number, y: number): number {
  return 0.5 * Math.atan2(sampleFieldBilinear(analysis.doubledSin, x, y), sampleFieldBilinear(analysis.doubledCos, x, y))
}

function importanceAt(analysis: Analysis, x: number, y: number): number {
  return sampleFieldBilinear(analysis.detail.importance, x, y)
}

function hairAt(analysis: Analysis, x: number, y: number): number {
  return sampleFieldBilinear(analysis.detail.hair, x, y)
}

function regionError(canvas: PaintCanvas, target: RgbImage, x: number, y: number, radius: number): number {
  let total = 0
  let count = 0
  const step = Math.max(1, Math.floor(radius / 3))
  for (let sy = y - radius; sy <= y + radius; sy += step) {
    for (let sx = x - radius; sx <= x + radius; sx += step) {
      if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) continue
      const i = (Math.floor(sy) * canvas.width + Math.floor(sx)) * 3
      total += Math.abs(canvas.color.data[i] - target.data[i]) + Math.abs(canvas.color.data[i + 1] - target.data[i + 1]) + Math.abs(canvas.color.data[i + 2] - target.data[i + 2])
      count++
    }
  }
  return count > 0 ? total / (count * 3) : 0
}

class ColourSources {
  private readonly cache = new Map<number, RgbImage>()
  private readonly tables: SummedTables

  constructor(graded: RgbImage) {
    this.tables = summedTables(graded)
  }

  forStroke(size: number): RgbImage {
    const radius = Math.max(1, Math.round(size * COLOUR_RADIUS_PER_SIZE))
    let image = this.cache.get(radius)
    if (!image) {
      image = kuwahara(this.tables, radius)
      this.cache.set(radius, image)
    }
    return image
  }
}

function coherentColor(plan: SubjectPaintingPlan, sample: Rgb, position: Point, care: number, random: Random): Rgb {
  const [lightness, chroma, hue] = srgbToOklch(sample)
  const scale = plan.baseSize * 4
  const hueField = fractalNoise2(position.x / scale, position.y / scale, plan.seed + 51, 2) - 0.5
  const lightField = fractalNoise2(position.x / scale, position.y / scale, plan.seed + 53, 2) - 0.5
  const darkness = 1 - smoothstep(0.25, 0.6, lightness)
  const anchor = lightness < 0.3 ? 0.35 : 1
  const restraint = 1 - 0.6 * care
  const hueSwing = plan.style.hueJitter * (0.6 + 1.1 * darkness) * restraint
  return oklchToSrgb([
    lightness + (lightField * 0.09 + random.gaussian() * 0.012) * anchor * restraint,
    chroma * (1 + (random.next() - 0.5) * 0.3),
    hue + hueField * 2 * hueSwing + random.gaussian() * 0.06 * restraint,
  ])
}

function oklabLightness(image: RgbImage): Field {
  const field = createField(image.width, image.height)
  const pixel = [0, 0, 0]
  for (let p = 0; p < field.data.length; p++) {
    pixel[0] = image.data[p * 3]
    pixel[1] = image.data[p * 3 + 1]
    pixel[2] = image.data[p * 3 + 2]
    field.data[p] = srgbToOklch(pixel)[0]
  }
  return field
}

export function gradeImage(source: RgbImage, style: ColorStyle, shadowScale: number): RgbImage {
  const graded = createImage(source.width, source.height)
  const regionLightness = gaussianBlurField(oklabLightness(source), Math.max(1, shadowScale))
  const pixel = [0, 0, 0]
  for (let i = 0; i < source.data.length; i += 3) {
    pixel[0] = source.data[i]
    pixel[1] = source.data[i + 1]
    pixel[2] = source.data[i + 2]
    const color = expressiveColor(pixel, style, regionLightness.data[i / 3])
    graded.data[i] = color[0]
    graded.data[i + 1] = color[1]
    graded.data[i + 2] = color[2]
  }
  return graded
}

interface Point {
  x: number
  y: number
}

interface StrokeShape {
  angle: number
  length: number
  width: number
}

const LINE_WORK = 0.8

function strokeShape(analysis: Analysis, position: Point, size: number, random: Random): StrokeShape {
  const flow = flowAngle(analysis, position.x, position.y)
  if (size <= analysisHairLimit(analysis) && importanceAt(analysis, position.x, position.y) > LINE_WORK) {
    return { angle: flow + random.gaussian() * 0.08, length: size * random.range(1.6, 2.4), width: size * random.range(0.22, 0.38) }
  }
  if (size <= analysisHairLimit(analysis) && hairAt(analysis, position.x, position.y) > HAIR_STROKE) {
    return { angle: flow + random.gaussian() * 0.12, length: size * random.range(2.2, 3.4), width: size * random.range(0.3, 0.5) }
  }
  const coherence = sampleFieldBilinear(analysis.coherence, position.x, position.y)
  return { angle: flow + random.gaussian() * (0.55 - 0.25 * coherence), length: size * random.range(1.0, 1.8), width: size * random.range(0.5, 1.0) }
}

interface StrokeContext {
  plan: SubjectPaintingPlan
  analysis: Analysis
  colours: RgbImage
  size: number
}

function sampleColour(context: StrokeContext, position: Point, care: number, random: Random): Rgb {
  const sample: Rgb = [0, 0, 0]
  sampleImageBilinear(context.colours, position.x, position.y, sample)
  return coherentColor(context.plan, sample, position, care, random)
}

function buildStroke(context: StrokeContext, position: Point, random: Random): KnifeStroke {
  const care = clamp01(importanceAt(context.analysis, position.x, position.y))
  const shape = strokeShape(context.analysis, position, context.size, random)
  const color = sampleColour(context, position, care, random)
  const reach = context.size * (1 - 0.7 * care)
  const neighbour = sampleColour(context, { x: position.x + random.gaussian() * reach, y: position.y + random.gaussian() * reach }, care, random)
  const exhausted = random.next() < 0.22 * (1 - care)
  return {
    x: position.x,
    y: position.y,
    ...shape,
    color,
    edgeColor: mixRgb(neighbour, color, 0.3),
    edgeMix: random.next() < 0.5 ? random.range(0.3, 0.85) * (1 - 0.5 * care) : 0,
    load: exhausted ? random.range(0.85, 1.1) : random.range(1.15, 1.6),
    thickness: random.range(0.55, 1),
    seed: random.int(1 << 30),
  }
}

function isHairStroke(analysis: Analysis, position: Point, stroke: KnifeStroke): boolean {
  return stroke.width <= analysis.baseSize * 0.7 && hairAt(analysis, position.x, position.y) > HAIR_STROKE
}

function overhangFor(analysis: Analysis, position: Point, stroke: KnifeStroke, random: Random): number {
  if (importanceAt(analysis, position.x, position.y) >= FACE_IMPORTANCE) return random.range(-0.5, 0.5)
  if (isHairStroke(analysis, position, stroke)) return stroke.width * random.range(0, 1.2) + stroke.length * random.range(0, 0.25)
  const blockIn = stroke.width > analysis.baseSize * 1.5
  return blockIn ? stroke.width * random.range(-0.25, 0) : stroke.width * random.range(-0.2, 0.3)
}

const TACKY_BACKGROUND_PICKUP = 0.14

function overBackground(analysis: Analysis, position: Point, stroke: KnifeStroke): KnifeStroke {
  const nearEdge = sampleFieldBilinear(analysis.signedDistance, position.x, position.y) > -stroke.length * 0.5
  return isHairStroke(analysis, position, stroke) && nearEdge ? { ...stroke, wetMix: TACKY_BACKGROUND_PICKUP } : stroke
}

function strokeClip(analysis: Analysis, position: Point, stroke: KnifeStroke, random: Random): StrokeClip {
  return { threshold: 0.5, edge: { signedDistance: analysis.signedDistance, overhang: overhangFor(analysis, position, stroke, random) } }
}

interface LayerRun {
  layer: PaintLayer
  context: StrokeContext
  target: RgbImage
  knife: DirtyKnife
}

const UNGUIDED_ERROR = 0.09

function errorNeeded(analysis: Analysis, layer: PaintLayer, position: Point, threshold: number): number {
  return importanceAt(analysis, position.x, position.y) >= layer.minImportance ? threshold : UNGUIDED_ERROR
}

function paintLayer(canvas: PaintCanvas, run: LayerRun, random: Random): KnifeStroke[] {
  const { layer, context, target } = run
  const threshold = layer.errorThreshold * (1.4 - context.plan.detail)
  const placed: KnifeStroke[] = []
  for (const position of layerCandidates(context.analysis, canvas, layer, context.size, random)) {
    const needed = errorNeeded(context.analysis, layer, position, threshold)
    if (needed > 0 && regionError(canvas, target, position.x, position.y, context.size * 0.5) < needed) continue
    const stroke = overBackground(context.analysis, position, run.knife.carryResidue(buildStroke(context, position, random)))
    rasterizeStroke(canvas, stroke, strokeClip(context.analysis, position, stroke, random))
    placed.push(stroke)
  }
  return placed
}

export interface SubjectResult {
  strokes: KnifeStroke[]
  dirt: KnifeStroke[]
}

export interface SubjectPreparation {
  analysis: Analysis
  colours: ColourSources
}

export function prepareSubject(plan: SubjectPaintingPlan): SubjectPreparation {
  return { analysis: analyse(plan), colours: new ColourSources(plan.graded) }
}

export function paintSubject(canvas: PaintCanvas, plan: SubjectPaintingPlan, prepared: SubjectPreparation = prepareSubject(plan)): SubjectResult {
  const random = createRandom(plan.seed)
  const { analysis, colours } = prepared
  const target = colours.forStroke(plan.baseSize * 0.32)
  const knife = new DirtyKnife(plan.dirt, random)
  const placed: KnifeStroke[] = []
  const dirt: KnifeStroke[] = []
  LAYERS.forEach((layer, index) => {
    const size = plan.baseSize * layer.sizeFactor
    const context: StrokeContext = { plan, analysis, colours: colours.forStroke(size), size }
    placed.push(...paintLayer(canvas, { layer, context, target, knife }, random))
    if (index === 0) placed.push(...coverBareCanvas(canvas, context, random))
    if (index === STRAY_DAB_LAYER) dirt.push(...paintStrayDabs(canvas, strayPlan(plan, analysis), random))
  })
  placed.push(...paintFeatureDabs(canvas, analysis, target, random))
  fillLeftoverBareCanvas(canvas, analysis, target)
  return { strokes: placed, dirt }
}

const FEATURE_DAB_SIZES = [0.26, 0.17]
const FEATURE_DAB_IMPORTANCE = 0.85
const FEATURE_DAB_ERROR = 0.03

const UNGUIDED_DAB_ERROR = 0.14

function isPaintedSubject(analysis: Analysis, spot: Point): boolean {
  return sampleFieldBilinear(analysis.signedDistance, spot.x, spot.y) < -1
}

function dabErrorNeeded(analysis: Analysis, spot: Point): number {
  return importanceAt(analysis, spot.x, spot.y) >= FEATURE_DAB_IMPORTANCE ? FEATURE_DAB_ERROR : UNGUIDED_DAB_ERROR
}

function featureDabSpots(canvas: PaintCanvas, analysis: Analysis, step: number, random: Random): Point[] {
  const spots: Point[] = []
  for (let gy = step / 2; gy < canvas.height; gy += step) {
    for (let gx = step / 2; gx < canvas.width; gx += step) {
      const spot = { x: gx + random.gaussian() * step * 0.3, y: gy + random.gaussian() * step * 0.3 }
      if (!isPaintedSubject(analysis, spot)) continue
      if (analysis.unguided || importanceAt(analysis, spot.x, spot.y) >= FEATURE_DAB_IMPORTANCE) spots.push(spot)
    }
  }
  return shuffled(spots, random)
}

function featureDab(analysis: Analysis, target: RgbImage, spot: Point, size: number, random: Random): KnifeStroke {
  const color: Rgb = [0, 0, 0]
  sampleImageBilinear(target, spot.x, spot.y, color)
  return {
    x: spot.x,
    y: spot.y,
    angle: flowAngle(analysis, spot.x, spot.y) + random.gaussian() * 0.35,
    length: size * random.range(1.0, 1.5),
    width: size * random.range(0.75, 1.0),
    color,
    edgeColor: color,
    edgeMix: 0,
    load: random.range(1.4, 1.6),
    thickness: random.range(0.45, 0.75),
    seed: random.int(1 << 30),
  }
}

function paintFeatureDabs(canvas: PaintCanvas, analysis: Analysis, target: RgbImage, random: Random): KnifeStroke[] {
  const placed: KnifeStroke[] = []
  for (const factor of FEATURE_DAB_SIZES) {
    const size = Math.max(2, analysis.baseSize * factor)
    for (const spot of featureDabSpots(canvas, analysis, Math.max(2, size * 0.7), random)) {
      if (regionError(canvas, target, spot.x, spot.y, size * 0.6) < dabErrorNeeded(analysis, spot)) continue
      const dab = featureDab(analysis, target, spot, size, random)
      rasterizeStroke(canvas, dab, { threshold: 0.5, edge: { signedDistance: analysis.signedDistance, overhang: 0 } })
      placed.push(dab)
    }
  }
  return placed
}

const BARE = 0.6

const COVER_PASSES = 3

function needsPaint(canvas: PaintCanvas, analysis: Analysis, index: number): boolean {
  return canvas.paint.data[index] < BARE && analysis.signedDistance.data[index] < -0.5
}

function bareSpots(canvas: PaintCanvas, analysis: Analysis, step: number, random: Random): Point[] {
  const spots: Point[] = []
  for (let y = Math.floor(step / 2); y < canvas.height; y += step) {
    for (let x = Math.floor(step / 2); x < canvas.width; x += step) {
      if (needsPaint(canvas, analysis, y * canvas.width + x)) spots.push({ x: x + random.gaussian() * step * 0.2, y: y + random.gaussian() * step * 0.2 })
    }
  }
  return spots
}

function coverBareCanvas(canvas: PaintCanvas, context: StrokeContext, random: Random): KnifeStroke[] {
  const placed: KnifeStroke[] = []
  for (let pass = 0; pass < COVER_PASSES; pass++) {
    const step = Math.max(2, Math.round(context.size * 0.35 / (pass + 1)))
    for (const position of bareSpots(canvas, context.analysis, step, random)) {
      if (!needsPaint(canvas, context.analysis, Math.round(position.y) * canvas.width + Math.round(position.x))) continue
      const stroke = { ...buildStroke(context, position, random), load: random.range(1.35, 1.6) }
      rasterizeStroke(canvas, stroke, { threshold: 0.5, edge: { signedDistance: context.analysis.signedDistance, overhang: random.range(0.5, 2) } })
      placed.push(stroke)
    }
  }
  return placed
}

function fillLeftoverBareCanvas(canvas: PaintCanvas, analysis: Analysis, target: RgbImage): void {
  for (let i = 0; i < canvas.paint.data.length; i++) {
    if (!needsPaint(canvas, analysis, i)) continue
    const cover = 1 - canvas.paint.data[i]
    for (let c = 0; c < 3; c++) canvas.color.data[i * 3 + c] += (target.data[i * 3 + c] - canvas.color.data[i * 3 + c]) * cover
    if (canvas.layer) canvas.layer.colorWeight.data[i] *= 1 - cover
    canvas.paint.data[i] = 1
  }
}

function shadowEdgeField(plan: SubjectPaintingPlan): Field {
  const luma = luminance(plan.graded)
  const { gx, gy } = sobel(gaussianBlurField(luma, plan.baseSize * 0.6))
  const field = createField(luma.width, luma.height)
  for (let i = 0; i < field.data.length; i++) field.data[i] = Math.hypot(gx.data[i], gy.data[i]) * (1.2 - luma.data[i])
  return field
}

function strayPlan(plan: SubjectPaintingPlan, analysis: Analysis): StrayDabPlan {
  return {
    graded: plan.graded,
    presence: analysis.presence,
    shadowEdges: shadowEdgeField(plan),
    flowAngle: (x, y) => flowAngle(analysis, x, y),
    baseSize: plan.baseSize,
    dirt: plan.dirt,
    isFace: (x, y) => importanceAt(analysis, x, y) >= FACE_IMPORTANCE * 0.5,
  }
}

function layerCandidates(analysis: Analysis, canvas: PaintCanvas, layer: PaintLayer, size: number, random: Random): Point[] {
  const spacing = Math.max(2, size * 0.62)
  const positions: Point[] = []
  for (let gy = spacing / 2; gy < canvas.height; gy += spacing) {
    for (let gx = spacing / 2; gx < canvas.width; gx += spacing) {
      const x = gx + random.gaussian() * spacing * 0.35
      const y = gy + random.gaussian() * spacing * 0.35
      if (!analysis.unguided && importanceAt(analysis, x, y) < layer.minImportance) continue
      if (random.next() > smoothstep(0.1, 0.4, sampleFieldBilinear(analysis.presence, x, y)) * layer.coverage) continue
      positions.push({ x, y })
    }
  }
  return shuffled(positions, random)
}

function shuffled<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = random.int(i + 1)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}
