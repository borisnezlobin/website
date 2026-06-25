import type { Item, StepGroup, Trail } from "./types";
import { classifyMarker, cleanLabel, type LandmarkKind } from "./landmarks";
import { dayTotals, trailTotals, type Totals } from "./totals";
import profileData from "../data/trail-profile.json";
import landmarkData from "../data/trail-landmarks.json";

// Brings the two halves of the page together:
//   • the real trail — a firsthand GPS track (34.3 km) sampled against 30 m topo,
//     so elevation and distance are accurate to the metre (see data/trail-profile);
//   • the counted steps — Boris's stair-by-stair tally, which lives in step-space
//     (a running count), not in kilometres.
//
// To draw the steps *on* the real trail we align the two: a handful of landmarks
// exist in both (the pass, the named ruins, the three camps), giving (stepCount →
// km) anchor pairs we interpolate between. Every stair group then lands at a real
// place on the mountain.

export interface ElevPoint {
  km: number;
  elev: number;
  steps: number; // counted steps that fall on the segment *after* this point
}

export interface TrekLandmark {
  name: string;
  km: number;
  elev: number;
  kind: string;
}

export interface DayTotals {
  name: string;
  totals: Totals;
}

export interface TrekData {
  totalKm: number;
  ascentM: number;
  descentM: number;
  minElev: number;
  maxElev: number;
  profile: ElevPoint[];
  maxStepsPerKm: number; // busiest staircase density, for colour scaling
  landmarks: TrekLandmark[];
  totals: Totals;
  perDay: DayTotals[];
  source: string;
}

// ---- walking the step data (minimum route) --------------------------------

interface RawMarker {
  x: number;
  name: string;
  kind: LandmarkKind;
}

const required = (g: StepGroup) => Math.max(0, g.steps - g.avoidable);

const laneCost = (items: Item[]): number =>
  items.reduce((sum, it) => {
    if (it.kind === "group" && it.group && !it.group.ambiguous) return sum + required(it.group);
    if (it.kind === "fork" && it.fork) {
      const real = it.fork.alternatives.filter((a) => !a.ambiguous);
      return sum + (real.length ? Math.min(...real.map(required)) : 0);
    }
    return sum;
  }, 0);

function cheapestAlt(alts: StepGroup[]): StepGroup | null {
  const real = alts.filter((a) => !a.ambiguous);
  if (!real.length) return null;
  return real.reduce((best, a) => (required(a) < required(best) ? a : best));
}

interface Walk {
  markers: RawMarker[];
  dayStartX: number[];
  totalX: number;
}

function walkSteps(trail: Trail): Walk {
  const markers: RawMarker[] = [];
  const dayStartX: number[] = [];
  let x = 0;

  const stride = (count: number) => {
    if (count > 0) x += count;
  };

  const walkItems = (items: Item[]) => {
    let i = 0;
    while (i < items.length) {
      const it = items[i];
      if (it.kind === "branch-open") {
        const lanes: Item[][] = [[]];
        i += 1;
        while (i < items.length && items[i].kind !== "branch-close") {
          if (items[i].kind === "lane-divider") lanes.push([]);
          else lanes[lanes.length - 1].push(items[i]);
          i += 1;
        }
        if (i < items.length) i += 1;
        walkItems(lanes.reduce((b, l) => (laneCost(l) < laneCost(b) ? l : b), lanes[0]));
        continue;
      }
      if (it.kind === "marker" && it.marker) {
        const name = cleanLabel(it.marker);
        if (name) markers.push({ x, name, kind: classifyMarker(name) });
      } else if (it.kind === "group" && it.group && !it.group.ambiguous) {
        stride(required(it.group));
      } else if (it.kind === "fork" && it.fork) {
        const best = cheapestAlt(it.fork.alternatives);
        if (best) stride(required(best));
      }
      i += 1;
    }
  };

  trail.days.forEach((day) => {
    dayStartX.push(x);
    walkItems(day.items);
  });

  return { markers, dayStartX, totalX: x };
}

// ---- aligning steps (step-count) to the trail (km) ------------------------

interface Anchor {
  x: number;
  km: number;
}

// Named landmarks present in both the step notes and the GPS track. The matcher
// finds the step position of each; the km comes from the GPS landmark list.
const NAME_LINKS: { test: (m: RawMarker) => boolean; landmark: RegExp }[] = [
  { test: (m) => m.kind === "pass", landmark: /dead woman/i },
  { test: (m) => /runkurakay/i.test(m.name), landmark: /^runkurakay$/i },
  { test: (m) => /sayacmarca/i.test(m.name), landmark: /sayacmarca/i },
  { test: (m) => /phuyupatamarca/i.test(m.name), landmark: /phuyupatamarca/i },
  { test: (m) => /intipata/i.test(m.name), landmark: /intipata/i },
  { test: (m) => /sun gate|inti punku/i.test(m.name), landmark: /sun gate|inti punku/i },
];

// (stepCount → km) anchor pairs from the landmarks both halves share.
function buildAnchors(walk: Walk, landmarks: TrekLandmark[]): Anchor[] {
  const kmOf = (re: RegExp) => landmarks.find((l) => re.test(l.name))?.km;
  const anchors: Anchor[] = [{ x: 0, km: 0 }];

  // The three overnight camps, by day boundary, matched to the camp landmarks.
  const camps = landmarks.filter((l) => l.kind === "camp");
  walk.dayStartX.forEach((x, idx) => {
    if (idx >= 1 && camps[idx - 1]) anchors.push({ x, km: camps[idx - 1].km });
  });

  // Named ruins / the pass.
  for (const link of NAME_LINKS) {
    const marker = walk.markers.find(link.test);
    const km = kmOf(link.landmark);
    if (marker && km != null) anchors.push({ x: marker.x, km });
  }

  anchors.push({ x: walk.totalX, km: profileData.totalKm });

  const seen = new Set<number>();
  return anchors
    .sort((a, b) => a.x - b.x)
    .filter((a) => (seen.has(a.x) ? false : (seen.add(a.x), true)));
}

// Below this grade the trail reads as a walk; the steeper a stretch is above it,
// the more of the segment's counted steps land there. Stone steps were built on
// the steep grades, so flats stay bare and the steepest staircases pull hardest.
const GRADE_FLOOR = 35; // metres climbed/dropped per km

// How many of the segment's steps fall on each piece of the elevation line.
function distributeSteps(profile: ElevPoint[], anchors: Anchor[]): number[] {
  const n = profile.length;
  const seg = new Array(n - 1).fill(0);
  const dkm = new Array(n - 1).fill(0);
  const mid = new Array(n - 1).fill(0);
  const grade = new Array(n - 1).fill(0);
  for (let i = 0; i < n - 1; i++) {
    dkm[i] = profile[i + 1].km - profile[i].km;
    mid[i] = (profile[i].km + profile[i + 1].km) / 2;
    grade[i] = dkm[i] > 0 ? Math.abs(profile[i + 1].elev - profile[i].elev) / dkm[i] : 0;
  }
  // Smooth the grade over a ~340 m window so a single noisy topo spike can't
  // hoard a whole segment's steps.
  const w = new Array(n - 1).fill(0);
  for (let i = 0; i < n - 1; i++) {
    let g = 0;
    let c = 0;
    for (let j = i - 1; j <= i + 1; j++)
      if (j >= 0 && j < n - 1) {
        g += grade[j];
        c++;
      }
    w[i] = Math.max(0, g / c - GRADE_FLOOR) * dkm[i]; // excess steepness × length
  }
  for (let k = 0; k < anchors.length - 1; k++) {
    const a = anchors[k];
    const b = anchors[k + 1];
    const steps = b.x - a.x;
    if (steps <= 0) continue;
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) if (mid[i] >= a.km && mid[i] < b.km) idx.push(i);
    if (!idx.length) continue;
    const W = idx.reduce((s, i) => s + w[i], 0);
    if (W > 0) {
      for (const i of idx) seg[i] += steps * (w[i] / W);
    } else {
      // a wholly gentle segment: spread its (few) steps by length
      const Lkm = idx.reduce((s, i) => s + dkm[i], 0) || 1;
      for (const i of idx) seg[i] += steps * (dkm[i] / Lkm);
    }
  }
  return seg;
}

// ---- public builder --------------------------------------------------------

let cached: TrekData | null = null;

export function buildTrek(trail: Trail): TrekData {
  if (cached) return cached;

  const landmarks = landmarkData as TrekLandmark[];
  const profile: ElevPoint[] = (profileData.points as [number, number][]).map(([km, elev]) => ({
    km,
    elev,
    steps: 0,
  }));

  const walk = walkSteps(trail);
  const anchors = buildAnchors(walk, landmarks);
  const seg = distributeSteps(profile, anchors);

  const densities: number[] = [];
  for (let i = 0; i < seg.length; i++) {
    profile[i].steps = seg[i];
    const d = seg[i] / (profile[i + 1].km - profile[i].km || 1);
    if (d > 0) densities.push(d);
  }
  // Reference density for colour = 88th percentile, so the typical staircase
  // reads clearly red and only a couple of outliers saturate fully.
  densities.sort((a, b) => a - b);
  const maxStepsPerKm = densities[Math.floor(densities.length * 0.88)] || 1;

  cached = {
    totalKm: profileData.totalKm,
    ascentM: profileData.ascentM,
    descentM: profileData.descentM,
    minElev: profileData.minElev,
    maxElev: profileData.maxElev,
    profile,
    maxStepsPerKm,
    landmarks,
    totals: trailTotals(trail),
    perDay: trail.days.map((day) => ({ name: day.name, totals: dayTotals(day) })),
    source: profileData.source,
  };
  return cached;
}
