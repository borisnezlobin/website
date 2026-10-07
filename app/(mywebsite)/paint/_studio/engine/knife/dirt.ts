import { oklchToSrgb, srgbToOklch, type Rgb } from '../color'
import type { Random } from '../random'
import { sampleFieldBilinear, sampleImageBilinear, type Field, type RgbImage } from '../raster'
import type { PaintCanvas } from './canvas'
import { rasterizeStroke, type KnifeStroke, type StrokeClip } from './stroke'

export class DirtyKnife {
  private lastColor: Rgb | null = null

  constructor(
    private readonly dirt: number,
    private readonly random: Random,
  ) {}

  carryResidue(stroke: KnifeStroke): KnifeStroke {
    const previous = this.lastColor
    this.lastColor = stroke.color
    if (!previous || this.random.next() > 0.4 * this.dirt) return stroke
    return { ...stroke, residue: { color: previous, amount: this.random.range(0.5, 0.95) } }
  }
}

const COOL_HUES = [(250 * Math.PI) / 180, (200 * Math.PI) / 180, (290 * Math.PI) / 180, (160 * Math.PI) / 180]
const WARM_HUES = [(40 * Math.PI) / 180, (15 * Math.PI) / 180, (70 * Math.PI) / 180]

export function strayColor(local: Rgb, random: Random): Rgb {
  const [lightness, chroma] = srgbToOklch(local)
  const cool = random.next() < 0.75
  const hue = random.pick(cool ? COOL_HUES : WARM_HUES) + random.gaussian() * 0.2
  return oklchToSrgb([
    lightness * random.range(0.82, 1.02),
    Math.min(0.16, Math.max(chroma, 0.06) * random.range(0.9, 1.4)),
    hue,
  ])
}


export interface StrayDabPlan {
  graded: RgbImage
  presence: Field
  shadowEdges: Field
  flowAngle: (x: number, y: number) => number
  baseSize: number
  dirt: number
  isFace: (x: number, y: number) => boolean
}

function clusterCentre(canvas: PaintCanvas, plan: StrayDabPlan, random: Random): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null
  let bestScore = 0
  for (let attempt = 0; attempt < 12; attempt++) {
    const x = random.next() * canvas.width
    const y = random.next() * canvas.height
    if (sampleFieldBilinear(plan.presence, x, y) < 0.6) continue
    const score = plan.isFace(x, y) ? 0 : sampleFieldBilinear(plan.shadowEdges, x, y) + random.next() * 0.02
    if (score > bestScore) {
      bestScore = score
      best = { x, y }
    }
  }
  return best
}

function strayDab(plan: StrayDabPlan, x: number, y: number, family: Rgb, random: Random): KnifeStroke {
  const local: Rgb = [0, 0, 0]
  sampleImageBilinear(plan.graded, x, y, local)
  const vivid = random.next() < 0.15
  const size = plan.baseSize * random.range(0.5, 1.8) * (vivid ? 0.6 : 1)
  const [lightness] = srgbToOklch(local)
  const [, familyChroma, familyHue] = srgbToOklch(family)
  const color = oklchToSrgb([lightness * random.range(0.85, 1.02), Math.min(0.17, familyChroma * (vivid ? 1.5 : random.range(0.6, 1.1))), familyHue + random.gaussian() * 0.15])
  return {
    x,
    y,
    angle: plan.flowAngle(x, y) + random.gaussian() * 0.4,
    length: size * random.range(1.0, 1.8),
    width: size * random.range(0.4, 0.85),
    color,
    edgeColor: local.slice() as Rgb,
    edgeMix: random.range(0.3, 0.7),
    load: vivid ? random.range(1.0, 1.2) : random.range(0.55, 0.85),
    thickness: random.range(0.6, 0.95),
    seed: random.int(1 << 30),
  }
}

export function paintStrayDabs(canvas: PaintCanvas, plan: StrayDabPlan, random: Random): KnifeStroke[] {
  const clusters = Math.round(((canvas.width * canvas.height) / (plan.baseSize * plan.baseSize)) * 0.012 * plan.dirt)
  const clip: StrokeClip = { presence: plan.presence, threshold: 0.5 }
  const dabs: KnifeStroke[] = []
  const local: Rgb = [0, 0, 0]
  for (let n = 0; n < clusters; n++) {
    const centre = clusterCentre(canvas, plan, random)
    if (!centre) continue
    sampleImageBilinear(plan.graded, centre.x, centre.y, local)
    const family = strayColor(local, random)
    const members = 2 + random.int(4)
    for (let m = 0; m < members; m++) {
      const spread = plan.baseSize * 1.6
      const x = centre.x + random.gaussian() * spread
      const y = centre.y + random.gaussian() * spread
      if (sampleFieldBilinear(plan.presence, x, y) < 0.55 || plan.isFace(x, y)) continue
      const dab = strayDab(plan, x, y, family, random)
      rasterizeStroke(canvas, dab, clip)
      dabs.push(dab)
    }
  }
  return dabs
}
