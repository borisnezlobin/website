import type { Rgb } from '../color'
import { distanceToMask, fillOutsideMask, fillSmallHoles, firmUpMask, resizeField, resizeImage } from '../filters'
import { fractalNoise2, type Random } from '../random'
import { createField, createImage, fillImage, sampleFieldBilinear, sampleImageBilinear, smoothstep, type Field, type RgbImage } from '../raster'
import { compositeLayer, createPaintCanvas, createPaintLayer, type PaintCanvas } from './canvas'
import { paintWetMerges } from './wetBlend'
import { coverBarePaper, nearSubjectZone } from './coverage'
import { faceZonesFor, type FacePlacement, type FaceShape, type FaceZones } from './faces'
import type { KnifeStroke } from './stroke'
import { runDirtDrips, runDrips } from './drips'
import { paintDryScumbles, paintUnderlayer, paintHaloBehind, paintHaloFront, paintHaloMass, paintSilhouetteScrapes, paintSplatter, type HaloPlan, type SubjectGeometry } from './halo'
import { jitterColor, subjectHues, type ColorStyle } from './palette'
import { fadeOutBottom, faceRegionOf, gradeImage, inHead, paintSubject, prepareSubject, type SubjectPaintingPlan, type SubjectPreparation, type SubjectResult } from './placement'
import { applyRelief } from './relief'
import type { KnifeSettings } from './settings'

export { defaultKnifeSettings, type KnifeSettings } from './settings'
export type { FaceShape, NormalisedPoint } from './faces'

export type ProgressReporter = (fraction: number, stage: string) => void

function subjectGeometry(mask: Field): SubjectGeometry & { coverage: number } {
  let count = 0
  let sumX = 0
  let sumY = 0
  let minX = mask.width
  let maxX = 0
  let minY = mask.height
  let maxY = 0
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[y * mask.width + x] < 0.5) continue
      count++
      sumX += x
      sumY += y
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  const coverage = count / (mask.width * mask.height)
  return {
    distance: distanceToMask(mask),
    centerX: count ? sumX / count : mask.width / 2,
    centerY: count ? sumY / count : mask.height / 2,
    size: count ? Math.max(maxX - minX, (maxY - minY) * 0.75) : Math.max(mask.width, mask.height),
    coverage,
  }
}

function subjectColorNear(graded: RgbImage, mask: Field, geometry: SubjectGeometry, x: number, y: number, random: Random, style: ColorStyle): Rgb {
  const dx = geometry.centerX - x
  const dy = geometry.centerY - y
  const distance = Math.hypot(dx, dy) || 1
  let px = x
  let py = y
  for (let travelled = 0; travelled < distance; travelled += 4) {
    if (sampleFieldBilinear(mask, px, py) >= 0.5) break
    px += (dx / distance) * 4
    py += (dy / distance) * 4
  }
  const reach = geometry.size * 0.08
  const sample: Rgb = [0, 0, 0]
  sampleImageBilinear(graded, px + (dx / distance) * reach + random.gaussian() * reach, py + (dy / distance) * reach + random.gaussian() * reach, sample)
  return jitterColor(sample, random, style, 0.3)
}

interface Composition {
  image: RgbImage
  mask: Field
  whole: Field
  placement: FacePlacement
}

const CROP_FADE = 0.12

interface CroppedSides {
  top: boolean
  left: boolean
  right: boolean
}

const TOUCH_BAND = 2

function touchesRow(mask: Field, y: number): boolean {
  for (let x = 0; x < mask.width; x++) if (mask.data[y * mask.width + x] > 0.5) return true
  return false
}

function touchesColumn(mask: Field, x: number): boolean {
  for (let y = 0; y < mask.height; y++) if (mask.data[y * mask.width + x] > 0.5) return true
  return false
}

function croppedSides(mask: Field): CroppedSides {
  const band = Array.from({ length: TOUCH_BAND }, (_, n) => n)
  return {
    top: band.some((n) => touchesRow(mask, n)),
    left: band.some((n) => touchesColumn(mask, n)),
    right: band.some((n) => touchesColumn(mask, mask.width - 1 - n)),
  }
}

function distanceToCroppedSide(x: number, y: number, width: number, sides: CroppedSides): number {
  let nearest = Infinity
  if (sides.top) nearest = Math.min(nearest, y)
  if (sides.left) nearest = Math.min(nearest, x)
  if (sides.right) nearest = Math.min(nearest, width - 1 - x)
  return nearest
}

function fadeAtCropEdges(mask: Field, seed: number): Field {
  const sides = croppedSides(mask)
  const faded = createField(mask.width, mask.height)
  const fade = Math.max(mask.width, mask.height) * CROP_FADE
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = y * mask.width + x
      const ragged = 0.3 + 1.4 * fractalNoise2(x / (fade * 0.6), y / (fade * 0.6), seed + 29, 3)
      faded.data[i] = mask.data[i] * smoothstep(0, fade * ragged, distanceToCroppedSide(x, y, mask.width, sides))
    }
  }
  return faded
}

function composeWithMargin(image: RgbImage, mask: Field, margin: number, canvasColor: Rgb, seed: number): Composition {
  if (margin <= 0) return { image, mask: fadeAtCropEdges(mask, seed), whole: mask, placement: { offsetX: 0, offsetY: 0, width: image.width, height: image.height } }
  const scale = 1 / (1 + margin)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const smallImage = resizeImage(image, width, height)
  const wholeSmallMask = resizeField(mask, width, height)
  const smallMask = fadeAtCropEdges(wholeSmallMask, seed)
  const offsetX = Math.round((image.width - width) / 2)
  const offsetY = image.height - height
  const composed = createImage(image.width, image.height)
  fillImage(composed, canvasColor)
  const composedMask = createField(image.width, image.height)
  const whole = createField(image.width, image.height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const target = (y + offsetY) * image.width + x + offsetX
      const source = y * width + x
      composedMask.data[target] = smallMask.data[source]
      whole.data[target] = wholeSmallMask.data[source]
      for (let c = 0; c < 3; c++) composed.data[target * 3 + c] = smallImage.data[source * 3 + c]
    }
  }
  return { image: composed, mask: composedMask, whole, placement: { offsetX, offsetY, width, height } }
}

function faceMask(composition: Composition): Field {
  const face = faceRegionOf(composition.image, composition.mask)
  const mask = createField(composition.mask.width, composition.mask.height)
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = y * mask.width + x
      if (inHead(face, x, y)) mask.data[i] = composition.mask.data[i]
    }
  }
  return mask
}

function paletteHues(composition: Composition): [number, number] {
  const [subjectPrimary, subjectSecondary] = subjectHues(composition.image, composition.mask)
  const [facePrimary] = subjectHues(composition.image, faceMask(composition))
  const separation = Math.abs(Math.atan2(Math.sin(facePrimary - subjectPrimary), Math.cos(facePrimary - subjectPrimary)))
  return [facePrimary, separation > 0.5 ? subjectPrimary : subjectSecondary]
}

function haloPlanFor(settings: KnifeSettings, composition: Composition, geometry: SubjectGeometry, baseSize: number, graded: RgbImage, style: ColorStyle): HaloPlan {
  return {
    geometry,
    baseSize,
    amount: settings.haloAmount,
    spread: settings.haloSpread,
    angle: settings.haloAngle,
    dryBrush: settings.dryBrush,
    splatter: settings.splatter,
    hues: paletteHues(composition),
    palette: settings.haloPalette,
    canvasColor: settings.canvas,
    subjectColorNear: (x, y, random) => subjectColorNear(graded, composition.mask, geometry, x, y, random, style),
    seed: settings.seed,
  }
}

interface KnifeScene {
  scale: number
  baseSize: number
  isolated: boolean
  composition: Composition
  geometry: SubjectGeometry
  style: ColorStyle
  graded: RgbImage
  faces: FaceZones | null
}

function fullFrame(image: RgbImage, mask: Field): Composition {
  return { image, mask, whole: mask, placement: { offsetX: 0, offsetY: 0, width: image.width, height: image.height } }
}

const LARGEST_HOLE_SHARE = 0.005
const NEAR_SUBJECT_BAND = 0.3

function cutOffAtBottom(mask: Field): boolean {
  return Array.from({ length: TOUCH_BAND }, (_, n) => mask.height - 1 - n).some((y) => touchesRow(mask, y))
}

function fadedComposition(composition: Composition, settings: KnifeSettings, baseSize: number): Composition {
  if (!cutOffAtBottom(composition.whole)) return composition
  return { ...composition, mask: fadeOutBottom(composition.mask, { dissolve: settings.dissolve, baseSize, seed: settings.seed }) }
}

const SMALLEST_PAINTING_SCALE = 0.45

function paintingScale(mask: Field, frame: number): number {
  const geometry = subjectGeometry(mask)
  if (geometry.coverage <= 0) return frame
  return Math.min(frame, Math.max(frame * SMALLEST_PAINTING_SCALE, geometry.size * 1.15))
}

function prepareScene(image: RgbImage, cutout: Field, settings: KnifeSettings, faces: FaceShape[]): KnifeScene {
  const firm = firmUpMask(cutout, { sure: 0.6, likely: 0.3, firmValue: 0.75, minDepth: Math.max(cutout.width, cutout.height) * 0.02 })
  const mask = fillSmallHoles(firm, cutout.width * cutout.height * LARGEST_HOLE_SHARE)
  const scale = Math.max(image.width, image.height)
  const baseSize = Math.max(2, settings.strokeSize * paintingScale(mask, scale))
  const isolated = subjectGeometry(mask).coverage < 0.97
  const composition = isolated ? fadedComposition(composeWithMargin(image, mask, settings.margin, settings.canvas, settings.seed), settings, baseSize) : fullFrame(image, mask)
  const style = { colorBoost: settings.colorBoost, coolShadows: settings.coolShadows, hueJitter: settings.hueJitter }
  const subjectColours = isolated ? fillOutsideMask(composition.image, composition.mask) : composition.image
  return {
    scale,
    baseSize,
    isolated,
    composition,
    geometry: subjectGeometry(composition.mask),
    style,
    graded: gradeImage(subjectColours, style, baseSize * 1.5),
    faces: faceZonesFor(faces, composition.placement, image.width, image.height, Math.max(1, baseSize * 0.4)),
  }
}

function protectedFace(scene: KnifeScene): (x: number, y: number) => boolean {
  const faces = scene.faces
  if (faces) return (x, y) => sampleFieldBilinear(faces.face, x, y) > 0.3
  const head = faceRegionOf(scene.composition.image, scene.composition.mask)
  return (x, y) => inHead(head, x, y)
}

function paintBackground(canvas: PaintCanvas, halo: HaloPlan, settings: KnifeSettings): KnifeStroke[] {
  const strokes = [...paintHaloBehind(canvas, halo), ...paintHaloMass(canvas, halo)]
  const wet = {
    distance: halo.geometry.distance,
    reach: halo.spread * halo.geometry.size,
    amount: settings.haloBlend,
    angle: halo.angle,
    dragLength: halo.baseSize * 1.6,
    baseSize: halo.baseSize,
    seed: settings.seed,
  }
  strokes.push(...paintWetMerges(canvas, wet))
  return strokes
}

function subjectPlan(scene: KnifeScene, settings: KnifeSettings): SubjectPaintingPlan {
  const { composition, graded, baseSize, style } = scene
  return { source: composition.image, graded, mask: composition.mask, baseSize, detail: settings.detail, style, dirt: settings.dirt, seed: settings.seed, faces: scene.faces }
}

const SUBJECT_DRIP_SHARE = 0.4

function finishingMarks(canvas: PaintCanvas, scene: KnifeScene, haloStrokes: KnifeStroke[], subject: SubjectResult, settings: KnifeSettings): void {
  const { strokes: subjectStrokes, dirt } = subject
  const isProtected = protectedFace(scene)
  paintSplatter(canvas, haloStrokes, { amount: settings.splatter, baseSize: scene.baseSize, seed: settings.seed, isProtected })
  const drips = { amount: settings.drips, length: settings.dripLength, width: Math.max(1.5, scene.scale * 0.0038), seed: settings.seed, isProtected }
  const mask = scene.composition.mask
  const onLowerOutline = (x: number, y: number) => sampleFieldBilinear(mask, x, y + scene.baseSize) < 0.5
  runDrips(canvas, haloStrokes, drips)
  runDrips(canvas, subjectStrokes, { ...drips, amount: drips.amount * SUBJECT_DRIP_SHARE, canStart: onLowerOutline })
  runDirtDrips(canvas, dirt, drips)
}

interface PreparedScene {
  key: string
  scene: KnifeScene
  subject: SubjectPreparation
  distanceToWhole: Field
}

let lastPrepared: PreparedScene | null = null

function fingerprint(data: Float32Array): number {
  const words = new Uint32Array(data.buffer, data.byteOffset, data.length)
  let hash = 2166136261
  for (let i = 0; i < words.length; i++) hash = Math.imul(hash ^ words[i], 16777619)
  return hash >>> 0
}

function sceneKey(image: RgbImage, mask: Field, settings: KnifeSettings, faces: FaceShape[]): string {
  const { strokeSize, margin, canvas, seed, dissolve, colorBoost, coolShadows, hueJitter } = settings
  return JSON.stringify([image.width, image.height, fingerprint(image.data), fingerprint(mask.data), faces, strokeSize, margin, canvas, seed, dissolve, colorBoost, coolShadows, hueJitter])
}

function preparedFor(image: RgbImage, mask: Field, settings: KnifeSettings, faces: FaceShape[]): PreparedScene {
  const key = sceneKey(image, mask, settings, faces)
  if (lastPrepared?.key === key) return lastPrepared
  const scene = prepareScene(image, mask, settings, faces)
  lastPrepared = { key, scene, subject: prepareSubject(subjectPlan(scene, settings)), distanceToWhole: distanceToMask(scene.composition.whole) }
  return lastPrepared
}

interface BackgroundLayers {
  key: string
  under: PaintCanvas
  over: PaintCanvas | null
  strokes: KnifeStroke[]
  zone: Field
  withHalo: boolean
}

interface SubjectLayer {
  key: string
  layer: PaintCanvas
  result: SubjectResult
}

let lastBackground: BackgroundLayers | null = null
let lastSubject: SubjectLayer | null = null

const TACKY_BAND = 3

function backgroundKey(prepared: PreparedScene, settings: KnifeSettings): string {
  const { haloAmount, haloSpread, haloAngle, haloBlend, dryBrush, haloPalette } = settings
  return prepared.key + JSON.stringify([haloAmount, haloSpread, haloAngle, haloBlend, dryBrush, haloPalette])
}

function groundUnderOverlay(under: PaintCanvas, scene: KnifeScene): Field {
  const paint = createField(under.width, under.height)
  for (let i = 0; i < paint.data.length; i++) paint.data[i] = Math.max(under.paint.data[i], scene.composition.whole.data[i] >= 0.5 ? 1 : 0)
  return paint
}

function paintBackgroundLayers(prepared: PreparedScene, settings: KnifeSettings, key: string): BackgroundLayers {
  const { scene } = prepared
  const { width, height } = scene.composition.mask
  const halo = haloPlanFor(settings, scene.composition, scene.geometry, scene.baseSize, scene.graded, scene.style)
  const withHalo = scene.isolated && settings.haloAmount > 0
  const under = createPaintCanvas(width, height, settings.canvas, settings.seed)
  if (!withHalo) return { key, under, over: null, strokes: [], zone: scene.composition.mask, withHalo }
  const zone = nearSubjectZone(prepared.distanceToWhole, halo.spread * halo.geometry.size * NEAR_SUBJECT_BAND)
  paintUnderlayer(under, halo, zone)
  const strokes = paintBackground(under, halo, settings)
  const over = createPaintLayer(width, height, { paint: groundUnderOverlay(under, scene), thickness: under.thickness })
  strokes.push(...paintSilhouetteScrapes(over, halo, protectedFace(scene)), ...paintHaloFront(over, halo), ...paintDryScumbles(over, halo))
  return { key, under, over, strokes, zone, withHalo }
}

function backgroundFor(prepared: PreparedScene, settings: KnifeSettings, report: ProgressReporter): BackgroundLayers {
  const key = backgroundKey(prepared, settings)
  if (lastBackground?.key === key) return lastBackground
  report(0.1, 'Laying the background strokes')
  lastBackground = paintBackgroundLayers(prepared, settings, key)
  return lastBackground
}

function subjectGround(prepared: PreparedScene, withHalo: boolean): { paint: Field; thickness: Field } {
  const { width, height } = prepared.distanceToWhole
  const paint = createField(width, height)
  const thickness = createField(width, height)
  if (!withHalo) return { paint, thickness }
  const band = prepared.scene.baseSize * TACKY_BAND
  for (let i = 0; i < paint.data.length; i++) {
    if (prepared.distanceToWhole.data[i] > band) continue
    paint.data[i] = 1
    thickness.data[i] = 0.6
  }
  return { paint, thickness }
}

function subjectFor(prepared: PreparedScene, settings: KnifeSettings, withHalo: boolean, report: ProgressReporter): SubjectLayer {
  const key = prepared.key + JSON.stringify([settings.detail, settings.dirt, withHalo])
  if (lastSubject?.key === key) return lastSubject
  report(0.4, 'Painting the subject')
  const { width, height } = prepared.distanceToWhole
  const layer = createPaintLayer(width, height, subjectGround(prepared, withHalo))
  const result = paintSubject(layer, subjectPlan(prepared.scene, settings), prepared.subject)
  lastSubject = { key, layer, result }
  return lastSubject
}

function composite(background: BackgroundLayers, subject: SubjectLayer): PaintCanvas {
  const withSubject = compositeLayer(background.under, subject.layer)
  return background.over ? compositeLayer(withSubject, background.over) : withSubject
}

export function renderKnife(image: RgbImage, mask: Field, settings: KnifeSettings, report: ProgressReporter = () => {}, faces: FaceShape[] = []): RgbImage {
  report(0.02, 'Preparing the photo')
  const prepared = preparedFor(image, mask, settings, faces)
  const background = backgroundFor(prepared, settings, report)
  const subject = subjectFor(prepared, settings, background.withHalo, report)
  report(0.8, 'Letting it drip')
  const canvas = composite(background, subject)
  coverBarePaper(canvas, background.zone)
  finishingMarks(canvas, prepared.scene, background.strokes, subject.result, settings)
  report(0.95, 'Lighting the paint')
  applyRelief(canvas, settings.relief, prepared.scene.scale)
  report(1, 'Done')
  return canvas.color
}
