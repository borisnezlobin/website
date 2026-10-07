import { createField, type Field } from '../raster'

const INK_THRESHOLD = 0.25
const MIN_GLYPH_PIXELS = 6

interface Component {
  minX: number
  maxX: number
  minY: number
  maxY: number
  pixels: number
}

function labelComponents(ink: Uint8Array, width: number, height: number): { labels: Int32Array; components: Component[] } {
  const labels = new Int32Array(width * height).fill(-1)
  const components: Component[] = []
  const stack: number[] = []
  for (let start = 0; start < ink.length; start++) {
    if (!ink[start] || labels[start] >= 0) continue
    const component: Component = { minX: width, maxX: 0, minY: height, maxY: 0, pixels: 0 }
    const id = components.length
    labels[start] = id
    stack.push(start)
    while (stack.length > 0) {
      const index = stack.pop() as number
      const x = index % width
      const y = (index - x) / width
      component.pixels++
      component.minX = Math.min(component.minX, x)
      component.maxX = Math.max(component.maxX, x)
      component.minY = Math.min(component.minY, y)
      component.maxY = Math.max(component.maxY, y)
      visitNeighbours(index, x, y, width, height, (next) => {
        if (!ink[next] || labels[next] >= 0) return
        labels[next] = id
        stack.push(next)
      })
    }
    components.push(component)
  }
  return { labels, components }
}

function visitNeighbours(index: number, x: number, y: number, width: number, height: number, visit: (next: number) => void): void {
  if (x > 0) visit(index - 1)
  if (x + 1 < width) visit(index + 1)
  if (y > 0) visit(index - width)
  if (y + 1 < height) visit(index + width)
}

function heightOf(c: Component): number {
  return c.maxY - c.minY + 1
}

function looksLikeGlyph(c: Component, scale: number): boolean {
  const h = heightOf(c)
  const w = c.maxX - c.minX + 1
  return c.pixels >= MIN_GLYPH_PIXELS && h <= scale * 0.14 && w <= h * 2.5 + 4
}

function areNeighbourGlyphs(a: Component, b: Component): boolean {
  const ha = heightOf(a)
  const hb = heightOf(b)
  const ratio = ha / hb
  if (ratio < 0.4 || ratio > 2.5) return false
  const overlap = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
  if (overlap < 0.4 * Math.min(ha, hb)) return false
  const gap = Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX)
  return gap < 1.2 * Math.max(ha, hb)
}

const MIN_GLYPHS_PER_LINE = 3

function findRoot(parents: Map<number, number>, id: number): number {
  let root = id
  while (parents.get(root) !== root) root = parents.get(root) as number
  parents.set(id, root)
  return root
}

function joinNeighbours(glyphs: { c: Component; id: number }[], parents: Map<number, number>): void {
  for (let i = 0; i < glyphs.length; i++) {
    for (let j = i + 1; j < glyphs.length; j++) {
      const a = glyphs[i].c
      const b = glyphs[j].c
      if (b.minX - a.maxX > 1.2 * Math.max(heightOf(a), heightOf(b))) break
      if (areNeighbourGlyphs(a, b)) parents.set(findRoot(parents, glyphs[i].id), findRoot(parents, glyphs[j].id))
    }
  }
}

function textComponents(components: Component[], scale: number): Set<number> {
  const glyphs = components.map((c, id) => ({ c, id })).filter(({ c }) => looksLikeGlyph(c, scale))
  glyphs.sort((a, b) => a.c.minX - b.c.minX)
  const parents = new Map(glyphs.map(({ id }) => [id, id]))
  joinNeighbours(glyphs, parents)
  const lineSizes = new Map<number, number>()
  for (const { id } of glyphs) lineSizes.set(findRoot(parents, id), (lineSizes.get(findRoot(parents, id)) ?? 0) + 1)
  return new Set(glyphs.filter(({ id }) => (lineSizes.get(findRoot(parents, id)) ?? 0) >= MIN_GLYPHS_PER_LINE).map(({ id }) => id))
}

function dilateLine(source: Float32Array, target: Float32Array, start: number, stride: number, count: number, radius: number): void {
  let last = -Infinity
  for (let n = 0; n < count; n++) {
    if (source[start + n * stride] > 0) last = n
    if (n - last <= radius) target[start + n * stride] = 1
  }
  last = Infinity
  for (let n = count - 1; n >= 0; n--) {
    if (source[start + n * stride] > 0) last = n
    if (last - n <= radius) target[start + n * stride] = 1
  }
}

function dilate(mask: Field, radius: number): Field {
  const { width, height } = mask
  const horizontal = createField(width, height)
  const result = createField(width, height)
  for (let y = 0; y < height; y++) dilateLine(mask.data, horizontal.data, y * width, 1, width, radius)
  for (let x = 0; x < width; x++) dilateLine(horizontal.data, result.data, x, width, height, radius)
  return result
}

export function findText(load: Field): Field {
  const { width, height } = load
  const scale = Math.max(width, height)
  const ink = new Uint8Array(width * height)
  for (let i = 0; i < ink.length; i++) ink[i] = load.data[i] > INK_THRESHOLD ? 1 : 0
  const { labels, components } = labelComponents(ink, width, height)
  const text = textComponents(components, scale)
  const mask = createField(width, height)
  for (let i = 0; i < labels.length; i++) if (labels[i] >= 0 && text.has(labels[i])) mask.data[i] = 1
  return dilate(mask, Math.max(3, Math.round(scale * 0.012)))
}
