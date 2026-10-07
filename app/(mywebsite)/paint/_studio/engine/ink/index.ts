import { srgbToOklab, type Rgb } from '../color'
import { fractalNoise2 } from '../random'
import { createField, createImage, smoothstep, type Field, type RgbImage } from '../raster'
import { bleedMobileInk, type BleedSettings } from './bleed'
import { estimatePaperColor, fromDensity, SATURATION_HEADROOM, toDensity, toInkAmount, toVisibleDensity, type DensityLayers } from './density'
import { dragBlade, type BladeLayers, type BladePoint, type BladeStroke } from './blade'
import { generateSwipes, type SwipeSettings } from './swipes'
import { findText } from './textGuard'

export type SmudgePoint = BladePoint

export interface SmudgeStroke {
  points: SmudgePoint[]
  radius: number
}

export type Triple = [number, number, number]

export interface InkSettings {
  paper: Rgb | null
  blankPaper: boolean
  fade: number
  puddles: number
  wetColors: Rgb[]
  colorTolerance: number
  wetness: number
  heavyInkThreshold: number
  pooledInk: number
  hold: number
  lift: number
  inkSaturation: number
  bleedRadius: number
  separation: number
  haloLean: 0 | 1 | 2
  settle: number
  wetSpread: number
  fiber: number
  driftAngle: number
  drift: number
  anisotropy: number
  flowAlignment: number
  smearAmount: number
  keepTextReadable: boolean
  swipeSeed: number
  smearAngle: number
  smearLength: number
  smearWidth: number
  smearPressure: number
  smearDrag: number
  smearCharge: number
  smearWetness: number
  looseness: number
  streaks: number
  chatter: number
  smudges: SmudgeStroke[]
  channelSolubility?: Triple
  channelReach?: Triple
  seed: number
}

export const defaultInkSettings: InkSettings = {
  paper: null,
  blankPaper: false,
  fade: 0.35,
  puddles: 0.6,
  wetColors: [],
  colorTolerance: 0.12,
  wetness: 0,
  heavyInkThreshold: 1.5,
  pooledInk: 0.6,
  hold: 0.36,
  lift: 0.58,
  inkSaturation: 2.6,
  bleedRadius: 0.045,
  separation: 0.8,
  haloLean: 0,
  settle: 0.54,
  wetSpread: 2.2,
  fiber: 0.3,
  driftAngle: -2.85,
  drift: 0.04,
  anisotropy: 0.35,
  flowAlignment: 0.3,
  smearAmount: 0.5,
  keepTextReadable: true,
  swipeSeed: 3,
  smearAngle: Math.PI / 2 + 0.15,
  smearLength: 0.28,
  smearWidth: 0.07,
  smearPressure: 0.85,
  smearDrag: 0.06,
  smearCharge: 1,
  smearWetness: 0.4,
  looseness: 0.8,
  streaks: 0.6,
  chatter: 0.25,
  smudges: [],
  seed: 7,
}

const INK_SCALE = 1.5
const FINGER_DRAG_MINIMUM_PX = 2
const BLANK_PAPER: Rgb = [0.93, 0.925, 0.9]

export type ProgressReporter = (fraction: number, stage: string) => void

interface ChannelProfile {
  solubility: Triple
  reach: Triple
}

function rotateToLead(values: Triple, lead: number): Triple {
  const result: Triple = [0, 0, 0]
  for (let c = 0; c < 3; c++) result[(c + lead) % 3] = values[c]
  return result
}

export function channelProfileFor(settings: Pick<InkSettings, 'separation' | 'haloLean' | 'channelSolubility' | 'channelReach'>): ChannelProfile {
  const s = settings.separation
  return {
    solubility: settings.channelSolubility ?? rotateToLead([1, 1 - 0.65 * s, Math.max(0, 1 - 1.2 * s)], settings.haloLean),
    reach: settings.channelReach ?? [1, 1, 1],
  }
}

function inkLoad(layers: DensityLayers, index: number): number {
  return Math.max(0, layers[0].data[index]) + Math.max(0, layers[1].data[index]) + Math.max(0, layers[2].data[index])
}

interface WetInk {
  dried: DensityLayers
  mobile: DensityLayers
  mobileReserve: DensityLayers
  excess: DensityLayers
  wetSource: Field
}

function emptyLayers(width: number, height: number): DensityLayers {
  return [createField(width, height), createField(width, height), createField(width, height)]
}

function pickedInkWetness(image: RgbImage, index: number, picked: Triple[], tolerance: number): number {
  const lab = srgbToOklab([image.data[index * 3], image.data[index * 3 + 1], image.data[index * 3 + 2]])
  let wet = 0
  for (const color of picked) {
    const distance = Math.hypot(lab[0] - color[0], lab[1] - color[1], lab[2] - color[2])
    wet = Math.max(wet, smoothstep(tolerance, tolerance * 0.45, distance))
  }
  return wet
}

interface WetnessRule {
  image: RgbImage
  picked: Triple[]
}

function wetnessAt(visible: DensityLayers, rule: WetnessRule, settings: InkSettings, index: number): number {
  if (rule.picked.length > 0) return pickedInkWetness(rule.image, index, rule.picked, settings.colorTolerance)
  const threshold = settings.heavyInkThreshold
  return smoothstep(threshold * 0.35, threshold, inkLoad(visible, index))
}

function puddleFactor(index: number, width: number, settings: InkSettings, scale: number): number {
  if (settings.puddles <= 0) return 1
  const x = index % width
  const y = Math.floor(index / width)
  const water = fractalNoise2(x / scale, y / scale, settings.seed + 13, 3)
  return Math.max(0, 1 + settings.puddles * (2.4 * water - 1.2))
}

function fadedDensity(visibleDensity: number, wet: number, fade: number): number {
  return visibleDensity > 0 ? visibleDensity * (1 - fade * (1 - wet)) : visibleDensity
}

function wetTheInk(visible: DensityLayers, mask: Field, settings: InkSettings, solubility: Triple, rule: WetnessRule): WetInk {
  const { width, height } = visible[0]
  const dried = emptyLayers(width, height)
  const mobile = emptyLayers(width, height)
  const mobileReserve = emptyLayers(width, height)
  const excess = emptyLayers(width, height)
  const wetSource = createField(width, height)
  const ceiling = settings.inkSaturation * SATURATION_HEADROOM
  const puddleScale = Math.max(width, height) * 0.12
  for (let i = 0; i < width * height; i++) {
    const wet = Math.min(1, settings.wetness * mask.data[i] * puddleFactor(i, width, settings, puddleScale)) * wetnessAt(visible, rule, settings, i)
    wetSource.data[i] = wet
    for (let c = 0; c < 3; c++) {
      const faded = fadedDensity(visible[c].data[i], wet, settings.fade)
      const visibleDensity = Math.min(faded, ceiling)
      const reserve = faded - visibleDensity
      const freedReserve = reserve * wet * settings.lift * solubility[c]
      excess[c].data[i] = reserve - freedReserve
      mobileReserve[c].data[i] = freedReserve
      const amount = toInkAmount(visibleDensity, settings.inkSaturation)
      const lifted = Math.max(0, amount) * wet * settings.lift * solubility[c]
      const pooled = Math.max(0, visibleDensity) * wet * settings.pooledInk * solubility[c]
      dried[c].data[i] = amount - lifted
      mobile[c].data[i] = lifted + pooled
    }
  }
  return { dried, mobile, mobileReserve, excess, wetSource }
}

function swipeSettingsFor(settings: InkSettings, protect: Field | null): SwipeSettings {
  return {
    amount: settings.smearAmount,
    angle: settings.smearAngle,
    protect,
    length: settings.smearLength,
    width: settings.smearWidth,
    pressure: settings.smearPressure,
    drag: settings.smearDrag,
    charge: settings.smearCharge,
    seed: settings.swipeSeed,
  }
}

function fingerBlade(stroke: SmudgeStroke, settings: InkSettings, scale: number, seed: number): BladeStroke {
  return {
    path: stroke.points,
    width: stroke.radius * 2,
    clearance: INK_SCALE * (1 - settings.smearPressure),
    dragLength: Math.max(FINGER_DRAG_MINIMUM_PX, settings.smearDrag * scale),
    seed,
  }
}

function swipeLoad(visible: DensityLayers, mask: Field): Field {
  const load = createField(mask.width, mask.height)
  for (let i = 0; i < load.data.length; i++) load.data[i] = inkLoad(visible, i) * mask.data[i]
  return load
}

function wetPaintTotal(layers: Field[], index: number): number {
  let total = 0
  for (const layer of layers) total += Math.max(0, layer.data[index])
  return total
}

const PAPER_WATER_CAPACITY = 1

function wetWhereSmeared(wetLayers: Field[], before: Float32Array, water: Field, smearWetness: number): void {
  for (let i = 0; i < before.length; i++) {
    const gained = wetPaintTotal(wetLayers, i) - before[i]
    const soaked = gained > 0 ? Math.max(water.data[i], gained * smearWetness) : water.data[i]
    water.data[i] = Math.min(PAPER_WATER_CAPACITY, soaked)
  }
}

interface SmearInputs {
  visible: DensityLayers
  mask: Field
  wet: WetInk
  scale: number
}

function smearPaint(inputs: SmearInputs, settings: InkSettings): void {
  const { dried, mobile, mobileReserve, excess, wetSource } = inputs.wet
  const wetLayers = [...mobile, ...mobileReserve]
  const before = new Float32Array(wetSource.data.length)
  for (let i = 0; i < before.length; i++) before[i] = wetPaintTotal(wetLayers, i)
  const load = swipeLoad(inputs.visible, inputs.mask)
  const protect = settings.keepTextReadable ? findText(load) : null
  const swipeLayers: BladeLayers = { wet: [...wetLayers, wetSource], paintLayers: 6, set: [...dried, ...excess], setInto: [0, 1, 2, 3, 4, 5], looseness: settings.looseness, protect, chargeable: 6, reserveFrom: 3 }
  const layers: BladeLayers = { ...swipeLayers, protect: null }
  const texture = { streaks: settings.streaks, chatter: settings.chatter }
  const swipes = generateSwipes(load, swipeSettingsFor(settings, protect), inputs.scale, INK_SCALE)
  swipes.forEach((swipe) => dragBlade(swipeLayers, swipe, texture))
  settings.smudges.forEach((stroke, n) => dragBlade(layers, fingerBlade(stroke, settings, inputs.scale, settings.seed + n * 31), texture))
  wetWhereSmeared(wetLayers, before, wetSource, settings.smearWetness)
}

function bleedSettingsFor(settings: InkSettings, scale: number, reach: Triple): BleedSettings {
  return {
    radius: settings.bleedRadius * scale,
    layerReach: [...reach, ...reach],
    hold: settings.hold,
    settle: settings.settle,
    wetSpread: settings.wetSpread,
    fiber: settings.fiber,
    driftAngle: settings.driftAngle,
    drift: settings.drift * scale,
    anisotropy: settings.anisotropy,
    flowAlignment: settings.flowAlignment,
    seed: settings.seed,
  }
}

function dryInto(dried: DensityLayers, bled: Field[], excess: DensityLayers, saturation: number): DensityLayers {
  for (let c = 0; c < 3; c++) {
    const target = dried[c].data
    const amount = bled[c].data
    const reserve = bled[c + 3].data
    const extra = excess[c].data
    for (let i = 0; i < target.length; i++) target[i] = toVisibleDensity(target[i] + amount[i], saturation) + extra[i] + reserve[i]
  }
  return dried
}

function onBlankPaper(image: RgbImage, mask: Field, paper: Rgb): RgbImage {
  const result = createImage(image.width, image.height)
  for (let i = 0; i < mask.data.length; i++) {
    const keep = mask.data[i]
    for (let c = 0; c < 3; c++) result.data[i * 3 + c] = paper[c] + (image.data[i * 3 + c] - paper[c]) * keep
  }
  return result
}

export function renderInk(source: RgbImage, mask: Field, settings: InkSettings, report?: ProgressReporter): RgbImage {
  const paper = settings.paper ?? (settings.blankPaper ? BLANK_PAPER : estimatePaperColor(source))
  const image = settings.blankPaper ? onBlankPaper(source, mask, paper) : source
  const scale = Math.max(image.width, image.height)
  const profile = channelProfileFor(settings)
  report?.(0.02, 'Wetting the ink')
  const rule: WetnessRule = { image, picked: settings.wetColors.map((color) => srgbToOklab(color)) }
  const visible = toDensity(image, paper)
  const wet = wetTheInk(visible, mask, settings, profile.solubility, rule)
  const { dried, mobile, mobileReserve, excess, wetSource } = wet
  const wetLayers = [...mobile, ...mobileReserve]

  report?.(0.1, 'Smearing')
  smearPaint({ visible, mask, wet, scale }, settings)

  const bleed = bleedSettingsFor(settings, scale, profile.reach)
  const bled = bleedMobileInk(wetLayers, wetSource, bleed, (f) => report?.(0.15 + f * 0.8, 'Bleeding'))
  report?.(1, 'Drying')
  return fromDensity(dryInto(dried, bled, excess, settings.inkSaturation), paper)
}
