export type ClusterCenter = {
  cx: number;
  cy: number;
  r: number;
  seed: number;
};

export type PhotoPlacement = {
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
};

export type CategoryLayoutInput = {
  slug: string;
  count: number;
};

const BASE_PHOTO_AREA = 180 * 120;
const DEFAULT_DENSITY = 0.32;
const DEFAULT_PADDING = 96;

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function deterministicSeed(s: string): number {
  return hashSeed(s);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function halton(index: number, base: number): number {
  let f = 1;
  let r = 0;
  let n = index;
  while (n > 0) {
    f /= base;
    r += f * (n % base);
    n = Math.floor(n / base);
  }
  return r;
}

function boundingRadiusFor(count: number, density: number): number {
  const area = (Math.max(6, count) * BASE_PHOTO_AREA) / Math.max(0.05, density);
  return Math.sqrt(area / Math.PI) + 80;
}

/**
 * Polar blob: small sinusoidal perturbation around `r`. Stays convex enough
 * for a single-radius point-in-shape test (compare candidate distance to
 * blobRadius at the candidate's polar angle).
 */
export function blobRadius(theta: number, r: number, seed: number): number {
  const s1 = ((seed & 0xffff) / 0xffff) * Math.PI * 2;
  const s2 = (((seed >>> 16) & 0xffff) / 0xffff) * Math.PI * 2;
  return r * (1 + 0.16 * Math.sin(3 * theta + s1) + 0.09 * Math.cos(5 * theta + s2));
}

export function blobOutlinePath(cluster: ClusterCenter, segments = 96): string {
  let d = "";
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const rr = blobRadius(theta, cluster.r, cluster.seed);
    const x = cluster.cx + rr * Math.cos(theta);
    const y = cluster.cy + rr * Math.sin(theta);
    d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + " Z";
}

/**
 * Place cluster centers on a ring around the origin so that adjacent clusters'
 * bounding circles never overlap.
 *
 *   R = max over (i, i+1) of (r_i + r_{i+1} + padding) / (2 sin(π/N))
 *
 * Categories are sorted by size and dealt around the ring with a half-step so
 * two large clusters don't end up adjacent.
 */
export function placeClusterCenters(
  categories: CategoryLayoutInput[],
  options: { density?: number; padding?: number; angleOffset?: number } = {},
): Map<string, ClusterCenter> {
  const out = new Map<string, ClusterCenter>();
  const N = categories.length;
  if (N === 0) return out;

  const density = options.density ?? DEFAULT_DENSITY;
  const padding = options.padding ?? DEFAULT_PADDING;
  const angleOffset = options.angleOffset ?? -Math.PI / 2;

  const radii = categories.map((c) => boundingRadiusFor(c.count, density));

  if (N === 1) {
    out.set(categories[0].slug, {
      cx: 0,
      cy: 0,
      r: radii[0],
      seed: hashSeed(categories[0].slug),
    });
    return out;
  }

  const indices = categories.map((_, i) => i).sort((a, b) => radii[b] - radii[a]);
  const slots = new Array<number>(N);
  const step = Math.max(1, Math.ceil(N / 2));
  let cursor = 0;
  const taken = new Set<number>();
  for (let i = 0; i < N; i++) {
    while (taken.has(cursor)) cursor = (cursor + 1) % N;
    slots[cursor] = indices[i];
    taken.add(cursor);
    cursor = (cursor + step) % N;
  }

  let R = 0;
  for (let i = 0; i < N; i++) {
    const r1 = radii[slots[i]];
    const r2 = radii[slots[(i + 1) % N]];
    const need = (r1 + r2 + padding) / (2 * Math.sin(Math.PI / N));
    if (need > R) R = need;
  }
  const maxR = Math.max(...radii);
  if (R < maxR + padding) R = maxR + padding;

  for (let i = 0; i < N; i++) {
    const idx = slots[i];
    const cat = categories[idx];
    const angle = angleOffset + (2 * Math.PI * i) / N;
    out.set(cat.slug, {
      cx: R * Math.cos(angle),
      cy: R * Math.sin(angle),
      r: radii[idx],
      seed: hashSeed(cat.slug),
    });
  }
  return out;
}

export type PlaceablePhoto = {
  slug: string;
  orientation: "h" | "v";
};

const MIN_GAP = 14;

export function placePhotosInCluster(
  photos: PlaceablePhoto[],
  cluster: ClusterCenter,
): PhotoPlacement[] {
  const placed: { lx: number; ly: number; w: number; h: number }[] = [];
  const out: PhotoPlacement[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const w = photo.orientation === "h" ? 180 : 120;
    const h = photo.orientation === "h" ? 120 : 180;
    const photoSeed = (cluster.seed ^ hashSeed(photo.slug)) >>> 0;
    const rng = mulberry32(photoSeed);

    let candidate: { lx: number; ly: number } | null = null;
    for (let attempt = 0; attempt < 120; attempt++) {
      const u = halton(i * 200 + attempt + 1, 2);
      const v = halton(i * 200 + attempt + 1, 3);
      const lx = (u * 2 - 1) * cluster.r;
      const ly = (v * 2 - 1) * cluster.r;
      const dist = Math.hypot(lx, ly);
      if (dist < 1e-3) continue;
      const theta = Math.atan2(ly, lx);
      const innerR = blobRadius(theta, cluster.r, cluster.seed) - Math.max(w, h) * 0.6;
      if (dist > innerR) continue;

      let collides = false;
      for (const b of placed) {
        const dx = b.lx - lx;
        const dy = b.ly - ly;
        const need = (b.w + w) / 2 + MIN_GAP;
        const need2 = (b.h + h) / 2 + MIN_GAP;
        if (Math.abs(dx) < need && Math.abs(dy) < need2) {
          collides = true;
          break;
        }
      }
      if (collides) continue;
      candidate = { lx, ly };
      break;
    }

    if (!candidate) {
      candidate = {
        lx: (rng() - 0.5) * cluster.r * 0.4,
        ly: (rng() - 0.5) * cluster.r * 0.4,
      };
    }

    placed.push({ lx: candidate.lx, ly: candidate.ly, w, h });
    out.push({
      x: cluster.cx + candidate.lx,
      y: cluster.cy + candidate.ly,
      rotation: (rng() - 0.5) * 8,
      width: w,
      height: h,
    });
  }
  return out;
}
