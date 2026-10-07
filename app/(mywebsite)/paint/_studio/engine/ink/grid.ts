import { createField, type Field } from '../raster'

export interface CoarseGrid {
  factor: number
  width: number
  height: number
  fineWidth: number
  fineHeight: number
  counts: Float32Array
  volume: Float32Array
  centersX: Float32Array
  centersY: Float32Array
  across: AxisLookup
  down: AxisLookup
}

interface AxisLookup {
  low: Int32Array
  high: Int32Array
  weight: Float64Array
}

function axisLookup(centers: Float32Array, fineSize: number): AxisLookup {
  const lookup: AxisLookup = { low: new Int32Array(fineSize), high: new Int32Array(fineSize), weight: new Float64Array(fineSize) }
  for (let position = 0; position < fineSize; position++) {
    const found = bracket(centers, position)
    lookup.low[position] = found.low
    lookup.high[position] = found.high
    lookup.weight[position] = found.weight
  }
  return lookup
}

function cellCenters(fineSize: number, cells: number, factor: number): Float32Array {
  const centers = new Float32Array(cells)
  for (let c = 0; c < cells; c++) {
    const start = c * factor
    const end = c === cells - 1 ? fineSize : start + factor
    centers[c] = (start + end) / 2 - 0.5
  }
  return centers
}

export function coarseGrid(fineWidth: number, fineHeight: number, factor: number): CoarseGrid {
  const width = Math.max(1, Math.floor(fineWidth / factor))
  const height = Math.max(1, Math.floor(fineHeight / factor))
  const grid: CoarseGrid = {
    factor,
    width,
    height,
    fineWidth,
    fineHeight,
    counts: new Float32Array(width * height),
    volume: new Float32Array(width * height),
    centersX: cellCenters(fineWidth, width, factor),
    centersY: cellCenters(fineHeight, height, factor),
    across: { low: new Int32Array(0), high: new Int32Array(0), weight: new Float64Array(0) },
    down: { low: new Int32Array(0), high: new Int32Array(0), weight: new Float64Array(0) },
  }
  grid.across = axisLookup(grid.centersX, fineWidth)
  grid.down = axisLookup(grid.centersY, fineHeight)
  for (let y = 0; y < fineHeight; y++) for (let x = 0; x < fineWidth; x++) grid.counts[cellIndex(grid, x, y)]++
  for (let i = 0; i < grid.counts.length; i++) grid.volume[i] = grid.counts[i] / (factor * factor)
  return grid
}

export function cellIndex(grid: CoarseGrid, x: number, y: number): number {
  const column = Math.min(Math.floor(x / grid.factor), grid.width - 1)
  const row = Math.min(Math.floor(y / grid.factor), grid.height - 1)
  return row * grid.width + column
}

export function restrictSum(field: Field, grid: CoarseGrid): Float32Array {
  const coarse = new Float32Array(grid.width * grid.height)
  for (let y = 0; y < grid.fineHeight; y++) {
    for (let x = 0; x < grid.fineWidth; x++) coarse[cellIndex(grid, x, y)] += field.data[y * grid.fineWidth + x]
  }
  return coarse
}

export function restrictMean(field: Field, grid: CoarseGrid): Float32Array {
  const coarse = restrictSum(field, grid)
  for (let i = 0; i < coarse.length; i++) coarse[i] /= grid.counts[i]
  return coarse
}

interface Bracket {
  low: number
  high: number
  weight: number
}

function bracket(centers: Float32Array, position: number): Bracket {
  const last = centers.length - 1
  if (last === 0 || position <= centers[0]) return { low: 0, high: 0, weight: 0 }
  if (position >= centers[last]) return { low: last, high: last, weight: 0 }
  let low = Math.min(last - 1, Math.max(0, Math.floor((position - centers[0]) / Math.max(1, centers[1] - centers[0]))))
  while (low < last - 1 && centers[low + 1] < position) low++
  while (low > 0 && centers[low] > position) low--
  return { low, high: low + 1, weight: (position - centers[low]) / (centers[low + 1] - centers[low]) }
}

export function interpolate(coarse: Float32Array, grid: CoarseGrid, x: number, y: number): number {
  const { across, down } = grid
  const ax = across.weight[x]
  const dy = down.weight[y]
  const row0 = down.low[y] * grid.width
  const row1 = down.high[y] * grid.width
  const top = coarse[row0 + across.low[x]] * (1 - ax) + coarse[row0 + across.high[x]] * ax
  const bottom = coarse[row1 + across.low[x]] * (1 - ax) + coarse[row1 + across.high[x]] * ax
  return top * (1 - dy) + bottom * dy
}

function binomialSmooth(values: Float32Array, width: number, height: number): Float32Array {
  const horizontal = new Float32Array(values.length)
  const result = new Float32Array(values.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      horizontal[i] = 0.25 * values[x > 0 ? i - 1 : i] + 0.5 * values[i] + 0.25 * values[x + 1 < width ? i + 1 : i]
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      result[i] = 0.25 * horizontal[y > 0 ? i - width : i] + 0.5 * horizontal[i] + 0.25 * horizontal[y + 1 < height ? i + width : i]
    }
  }
  return result
}

interface CellBudget {
  stayRatio: Float32Array
  stayTarget: Float32Array
  arrivals: Float32Array
}

function cellBudget(before: Float32Array, after: Float32Array): CellBudget {
  const stayRatio = new Float32Array(before.length)
  const stayTarget = new Float32Array(before.length)
  const arrivals = new Float32Array(before.length)
  for (let i = 0; i < before.length; i++) {
    const stay = Math.min(before[i], after[i])
    const ratio = before[i] > 1e-12 ? stay / before[i] : 1
    stayRatio[i] = ratio > 1 - 1e-5 ? 1 : ratio
    stayTarget[i] = before[i] * stayRatio[i]
    arrivals[i] = Math.max(0, after[i] - stayTarget[i])
  }
  return { stayRatio, stayTarget, arrivals }
}

function neighbourhoodRatio(target: Float32Array, actual: Float32Array, grid: CoarseGrid, fallback: number): Float32Array {
  let blurredTarget = target
  let blurredActual = actual
  for (let pass = 0; pass < 2; pass++) {
    blurredTarget = binomialSmooth(blurredTarget, grid.width, grid.height)
    blurredActual = binomialSmooth(blurredActual, grid.width, grid.height)
  }
  const ratio = new Float32Array(target.length)
  for (let i = 0; i < target.length; i++) ratio[i] = blurredActual[i] > 1e-12 ? blurredTarget[i] / blurredActual[i] : fallback
  return ratio
}

interface FinePart {
  values: Float32Array
  perCell: Float32Array
}

function shapeFine(grid: CoarseGrid, sample: (x: number, y: number, index: number) => number): FinePart {
  const values = new Float32Array(grid.fineWidth * grid.fineHeight)
  const perCell = new Float32Array(grid.width * grid.height)
  for (let y = 0; y < grid.fineHeight; y++) {
    for (let x = 0; x < grid.fineWidth; x++) {
      const i = y * grid.fineWidth + x
      values[i] = sample(x, y, i)
      perCell[cellIndex(grid, x, y)] += values[i]
    }
  }
  return { values, perCell }
}

function settleToBudget(grid: CoarseGrid, part: FinePart, target: Float32Array, fallback: number): Float32Array {
  const factor = neighbourhoodRatio(target, part.perCell, grid, fallback)
  const values = new Float32Array(part.values.length)
  for (let y = 0; y < grid.fineHeight; y++) {
    for (let x = 0; x < grid.fineWidth; x++) {
      const i = y * grid.fineWidth + x
      values[i] = part.values[i] * Math.max(0, interpolate(factor, grid, x, y))
    }
  }
  return values
}

export function reconstructLocally(source: Field, before: Float32Array, after: Float32Array, grid: CoarseGrid, mottling: Float32Array): Field {
  const budget = cellBudget(before, after)
  const arrivalDensity = new Float32Array(before.length)
  for (let i = 0; i < before.length; i++) arrivalDensity[i] = budget.arrivals[i] / grid.counts[i]
  const smoothArrivals = binomialSmooth(arrivalDensity, grid.width, grid.height)
  const kept = shapeFine(grid, (x, y, i) => source.data[i] * Math.min(1, Math.max(0, interpolate(budget.stayRatio, grid, x, y))))
  const arrived = shapeFine(grid, (x, y, i) => Math.max(0, interpolate(smoothArrivals, grid, x, y)) * mottling[i] + 1e-9)
  const keptValues = settleToBudget(grid, kept, budget.stayTarget, 1)
  const arrivedValues = settleToBudget(grid, arrived, budget.arrivals, 0)
  const fine = createField(grid.fineWidth, grid.fineHeight)
  for (let i = 0; i < fine.data.length; i++) fine.data[i] = keptValues[i] + arrivedValues[i]
  return fine
}
