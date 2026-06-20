// A tiny, dependency-free 3D wireframe generator for Inca staircases.
//
// You cannot recover a true 3D scan from one photo — that needs many overlapping
// shots (photogrammetry) or a depth sensor. So this is an honest alternative: a
// *parametric reconstruction*. Each photographed flight is described by a handful
// of numbers (how many steps, how tall/deep, how wide, how irregular), and we
// procedurally build a wireframe that captures its character — rough, hand-cut,
// meandering Inca stonework rather than crisp CAD — which the viewer can orbit.

export type Vec3 = [number, number, number];

export interface StairSpec {
  steps: number; // how many risers in the flight
  rise: number; // step height, relative units
  run: number; // tread depth, relative units
  width: number; // flight width, relative units
  jitter: number; // 0..1 — how irregular the stones are
  meander: number; // sideways wander of the flight, relative units
  seed: number; // makes the irregularity deterministic
}

export type EdgeKind = "nose" | "tread" | "riser" | "rung";

export interface StairMesh {
  points: Vec3[];
  edges: { a: number; b: number; kind: EdgeKind }[];
  center: Vec3;
  radius: number;
}

// Deterministic PRNG so a given seed always yields the same stones.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const LANES = 5; // longitudinal lines across the tread width

export function buildStairMesh(spec: StairSpec): StairMesh {
  const rng = mulberry32(spec.seed);
  const wob = (amt: number) => (rng() - 0.5) * 2 * amt; // signed wobble

  // Walk up the flight building a profile of (z forward, y up) vertices.
  // Each step contributes a riser vertex then a tread vertex. Per step we also
  // fix a width and a sideways centre so the whole flight can wander and taper.
  type PV = { z: number; y: number; cx: number; halfW: number; noseTop: boolean };
  const profile: PV[] = [];

  let z = 0;
  let y = 0;
  profile.push({ z, y, cx: wob(spec.meander * 0.4), halfW: spec.width / 2, noseTop: false });

  for (let i = 0; i < spec.steps; i++) {
    const rise = spec.rise * (1 + wob(spec.jitter * 0.55));
    const run = spec.run * (1 + wob(spec.jitter * 0.5));
    const halfW = (spec.width / 2) * (1 + wob(spec.jitter * 0.18));
    // gentle, correlated sideways drift plus a little per-step noise
    const cx = Math.sin(i * 0.45) * spec.meander + wob(spec.meander * 0.25);

    // up the riser (front face of the next tread)
    y += rise;
    profile.push({ z, y, cx, halfW, noseTop: true });
    // forward across the tread
    z += run;
    profile.push({ z, y, cx, halfW, noseTop: false });
  }

  // Lay LANES longitudinal lines across the width, each following the profile,
  // with a touch of per-vertex noise so no two stones line up perfectly.
  const points: Vec3[] = [];
  const idx: number[][] = []; // idx[v][lane] -> point index
  for (let v = 0; v < profile.length; v++) {
    const p = profile[v];
    const row: number[] = [];
    for (let l = 0; l < LANES; l++) {
      const f = l / (LANES - 1) - 0.5; // -0.5..0.5
      const nx = wob(spec.width * spec.jitter * 0.05);
      const ny = wob(spec.rise * spec.jitter * 0.25);
      const nz = wob(spec.run * spec.jitter * 0.18);
      points.push([p.cx + f * p.halfW * 2 + nx, p.y + ny, p.z + nz]);
      row.push(points.length - 1);
    }
    idx.push(row);
  }

  const edges: StairMesh["edges"] = [];
  // longitudinal edges (along the flight) — vertical bits are risers, flat bits treads
  for (let v = 0; v < profile.length - 1; v++) {
    const vertical = Math.abs(profile[v + 1].y - profile[v].y) > Math.abs(profile[v + 1].z - profile[v].z);
    for (let l = 0; l < LANES; l++) {
      edges.push({ a: idx[v][l], b: idx[v + 1][l], kind: vertical ? "riser" : "tread" });
    }
  }
  // cross edges (across the width) — the top of each riser is the step "nose"
  for (let v = 0; v < profile.length; v++) {
    const kind: EdgeKind = profile[v].noseTop ? "nose" : "rung";
    for (let l = 0; l < LANES - 1; l++) {
      edges.push({ a: idx[v][l], b: idx[v][l + 1], kind });
    }
  }

  // bounds for centring + framing
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let k = 0; k < 3; k++) {
      if (p[k] < min[k]) min[k] = p[k];
      if (p[k] > max[k]) max[k] = p[k];
    }
  }
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const radius =
    0.5 * Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;

  return { points, edges, center, radius };
}
