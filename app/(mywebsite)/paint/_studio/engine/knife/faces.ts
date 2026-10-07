import { gaussianBlurField } from '../filters'
import { createField, type Field } from '../raster'

export type NormalisedPoint = [number, number]

export interface FaceShape {
  oval: NormalisedPoint[]
  features: Record<string, NormalisedPoint[]>
}

export interface FacePlacement {
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface FaceBox {
  top: number
  bottom: number
  left: number
  right: number
}

export interface FaceZones {
  face: Field
  features: Field
  box: FaceBox
}

interface Point {
  x: number
  y: number
}

const FEATURE_GROWTH: Record<string, [number, number]> = {
  leftEye: [1.8, 3.0],
  rightEye: [1.8, 3.0],
  leftBrow: [1.25, 2.2],
  rightBrow: [1.25, 2.2],
  lips: [1.3, 1.6],
}

function toPixels(points: NormalisedPoint[], placement: FacePlacement): Point[] {
  return points.map(([x, y]) => ({ x: placement.offsetX + x * placement.width, y: placement.offsetY + y * placement.height }))
}

function grown(points: Point[], [sx, sy]: [number, number]): Point[] {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length
  return points.map((p) => ({ x: cx + (p.x - cx) * sx, y: cy + (p.y - cy) * sy }))
}

function crossings(polygon: Point[], y: number): number[] {
  const xs: number[] = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    if ((a.y <= y) === (b.y <= y)) continue
    xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x))
  }
  return xs.sort((p, q) => p - q)
}

function fillPolygon(field: Field, polygon: Point[]): void {
  const top = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p.y))))
  const bottom = Math.min(field.height - 1, Math.ceil(Math.max(...polygon.map((p) => p.y))))
  for (let y = top; y <= bottom; y++) {
    const xs = crossings(polygon, y + 0.5)
    for (let n = 0; n + 1 < xs.length; n += 2) {
      const from = Math.max(0, Math.ceil(xs[n] - 0.5))
      const to = Math.min(field.width - 1, Math.floor(xs[n + 1] - 0.5))
      for (let x = from; x <= to; x++) field.data[y * field.width + x] = 1
    }
  }
}

function boxOf(polygons: Point[][]): FaceBox {
  const points = polygons.flat()
  return {
    top: Math.min(...points.map((p) => p.y)),
    bottom: Math.max(...points.map((p) => p.y)),
    left: Math.min(...points.map((p) => p.x)),
    right: Math.max(...points.map((p) => p.x)),
  }
}

export function faceZonesFor(faces: FaceShape[], placement: FacePlacement, width: number, height: number, softness: number): FaceZones | null {
  if (faces.length === 0) return null
  const face = createField(width, height)
  const features = createField(width, height)
  const ovals = faces.map((shape) => toPixels(shape.oval, placement))
  ovals.forEach((oval) => fillPolygon(face, oval))
  for (const shape of faces) {
    for (const [name, points] of Object.entries(shape.features)) fillPolygon(features, grown(toPixels(points, placement), FEATURE_GROWTH[name] ?? [1.3, 1.3]))
  }
  return { face: gaussianBlurField(face, softness), features: gaussianBlurField(features, softness * 0.5), box: boxOf(ovals) }
}
