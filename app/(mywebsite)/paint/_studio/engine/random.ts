export interface Random {
  next(): number
  range(min: number, max: number): number
  int(maxExclusive: number): number
  gaussian(): number
  pick<T>(items: readonly T[]): T
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0 || 0x9e3779b9
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    gaussian: () => {
      const u = Math.max(next(), 1e-9)
      const v = next()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    pick: (items) => items[Math.floor(next() * items.length)],
  }
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function valueNoise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = fade(x - xi)
  const fy = fade(y - yi)
  const a = hash2(xi, yi, seed)
  const b = hash2(xi + 1, yi, seed)
  const c = hash2(xi, yi + 1, seed)
  const d = hash2(xi + 1, yi + 1, seed)
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
}

export function fractalNoise2(x: number, y: number, seed: number, octaves = 4): number {
  let amplitude = 0.5
  let frequency = 1
  let total = 0
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    total += amplitude * valueNoise2(x * frequency, y * frequency, seed + o * 101)
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }
  return total / norm
}

export function valueNoise1(x: number, seed: number): number {
  return valueNoise2(x, 0.5, seed)
}
