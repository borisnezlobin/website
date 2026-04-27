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

const MIN_CENTER_DIST = 70;
const DEFAULT_PACK_DENSITY = 0.62;
const CLUSTER_MIN_RADIUS = 140;
const CLUSTER_MARGIN = 70;
const DEFAULT_PADDING = 80;

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
  const area = (Math.max(4, count) * MIN_CENTER_DIST * MIN_CENTER_DIST) / Math.max(0.1, density);
  return Math.max(CLUSTER_MIN_RADIUS, Math.sqrt(area / Math.PI) + CLUSTER_MARGIN);
}

// Worst-case multiplier: the blob's polar perturbation peaks at 1 + 0.16 + 0.09.
export const BLOB_MAX_RADIUS_RATIO = 1.25;

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

  const density = options.density ?? DEFAULT_PACK_DENSITY;
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

function photoSize(orientation: "h" | "v"): { w: number; h: number } {
  return orientation === "h" ? { w: 180, h: 120 } : { w: 120, h: 180 };
}

export type ReservedBox = { width: number; height: number };

/**
 * Pack photos inside a cluster's blob. Uses a center-distance constraint
 * (not a bbox check), so photos overlap freely — this is what gives the
 * dense moodboard look. The blob radius keeps everything inside the cluster.
 *
 * If `reserved` is provided, the rectangle (centered at cluster center) is
 * kept clear — we use this to leave room for the cluster's label.
 */
export function placePhotosInCluster(
  photos: PlaceablePhoto[],
  cluster: ClusterCenter,
  reserved?: ReservedBox,
): PhotoPlacement[] {
  const placed: { lx: number; ly: number }[] = [];
  const out: PhotoPlacement[] = [];
  const minDistSq = MIN_CENTER_DIST * MIN_CENTER_DIST;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const { w, h } = photoSize(photo.orientation);
    const photoSeed = (cluster.seed ^ hashSeed(photo.slug)) >>> 0;
    const rng = mulberry32(photoSeed);

    let candidate: { lx: number; ly: number } | null = null;
    for (let attempt = 0; attempt < 200; attempt++) {
      const u = halton(i * 250 + attempt + 1, 2);
      const v = halton(i * 250 + attempt + 1, 3);
      const lx = (u * 2 - 1) * cluster.r;
      const ly = (v * 2 - 1) * cluster.r;
      const dist = Math.hypot(lx, ly);
      if (dist < 1e-3) continue;
      const theta = Math.atan2(ly, lx);
      const innerR = blobRadius(theta, cluster.r, cluster.seed) - Math.max(w, h) * 0.45;
      if (dist > innerR) continue;

      if (reserved) {
        const halfRW = reserved.width / 2 + w / 2;
        const halfRH = reserved.height / 2 + h / 2;
        if (Math.abs(lx) < halfRW && Math.abs(ly) < halfRH) continue;
      }

      let tooClose = false;
      for (const b of placed) {
        const dx = b.lx - lx;
        const dy = b.ly - ly;
        if (dx * dx + dy * dy < minDistSq) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      candidate = { lx, ly };
      break;
    }

    if (!candidate) {
      const angle = rng() * Math.PI * 2;
      const radius = rng() * cluster.r * 0.5;
      candidate = { lx: Math.cos(angle) * radius, ly: Math.sin(angle) * radius };
    }

    placed.push(candidate);
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

/**
 * Scatter photos along an annulus around the origin — used for uncategorized
 * photos that sit beyond all clusters, forming an outer perimeter.
 */
export function placePhotosInRing(
  photos: PlaceablePhoto[],
  innerRadius: number,
  ringWidth: number,
  seed = 0xa5a5,
): PhotoPlacement[] {
  const out: PhotoPlacement[] = [];
  const N = photos.length;
  if (N === 0) return out;
  const minDistSq = MIN_CENTER_DIST * MIN_CENTER_DIST;
  const placed: { lx: number; ly: number }[] = [];

  for (let i = 0; i < N; i++) {
    const photo = photos[i];
    const { w, h } = photoSize(photo.orientation);
    const photoSeed = (seed ^ hashSeed(photo.slug)) >>> 0;
    const rng = mulberry32(photoSeed);
    const baseAngle = (i / N) * Math.PI * 2;

    let candidate: { lx: number; ly: number } | null = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const angleJitter = (rng() - 0.5) * ((Math.PI * 2) / N) * 1.4;
      const angle = baseAngle + angleJitter;
      const r = innerRadius + rng() * ringWidth;
      const lx = Math.cos(angle) * r;
      const ly = Math.sin(angle) * r;

      let tooClose = false;
      for (const b of placed) {
        const dx = b.lx - lx;
        const dy = b.ly - ly;
        if (dx * dx + dy * dy < minDistSq) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      candidate = { lx, ly };
      break;
    }

    if (!candidate) {
      const angle = baseAngle;
      const r = innerRadius + ringWidth / 2;
      candidate = { lx: Math.cos(angle) * r, ly: Math.sin(angle) * r };
    }

    placed.push(candidate);
    out.push({
      x: candidate.lx,
      y: candidate.ly,
      rotation: (rng() - 0.5) * 12,
      width: w,
      height: h,
    });
  }
  return out;
}

/**
 * Returns the outermost radius covered by all clusters — useful for placing
 * an outer ring of photos that sits beyond the clusters.
 */
export function outerExtent(clusters: Map<string, ClusterCenter>, padding = 90): number {
  let max = 0;
  for (const c of clusters.values()) {
    const reach = Math.hypot(c.cx, c.cy) + c.r;
    if (reach > max) max = reach;
  }
  return max + padding;
}
