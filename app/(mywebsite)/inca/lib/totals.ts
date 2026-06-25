import type { Day, Item, StepGroup, Trail } from "./types";

// The two numbers this project is really after:
//   totalStairs — every stair that physically exists on the trail. Avoidable
//                 steps and both sides of every fork/branch are counted; the
//                 ambiguous (±) ones are held aside as a separate "maybe" band.
//   minStairs   — the fewest you must actually take to finish: avoidable steps
//                 skipped, ambiguous ignored, and the cheaper side of each
//                 fork/branch chosen.
export interface Totals {
  totalStairs: number;
  upTotal: number; // every physical step that climbs (upTotal + downTotal = totalStairs)
  downTotal: number; // every physical step that descends
  minStairs: number;
  ambiguousStairs: number; // ± "maybe" stairs — a band on totalStairs, never in min
  expectedLow: number; // realistic count: cheapest fork/branch at each choice
  expectedHigh: number; // realistic count: costliest fork/branch at each choice
  up: number; // climb on the minimum route
  down: number; // descent on the minimum route
  avoidable: number; // skippable stairs along the way
  groupCount: number;
  forkCount: number;
  branchCount: number;
  markerCount: number;
  uncertaintyUpTo: number;
}

// The expected (realistic) count assumes a hiker who walks around only a quarter
// of the avoidable steps and treats half the ± "maybe" steps as real. The range
// itself comes from the forks and branches: the low end takes the cheapest side
// of every choice, the high end the costliest.
const AVOIDABLE_TAKEN = 0.75; // climb 75% of skippable steps (skirt around 25%)
const AMBIGUOUS_TAKEN = 0.5; // count half of the ± "maybe" steps
const expectedGroup = (g: StepGroup) => g.steps - g.avoidable + AVOIDABLE_TAKEN * g.avoidable;
const expectedAmbiguous = (g: StepGroup) => AMBIGUOUS_TAKEN * g.steps;

function empty(): Totals {
  return {
    totalStairs: 0,
    upTotal: 0,
    downTotal: 0,
    minStairs: 0,
    ambiguousStairs: 0,
    expectedLow: 0,
    expectedHigh: 0,
    up: 0,
    down: 0,
    avoidable: 0,
    groupCount: 0,
    forkCount: 0,
    branchCount: 0,
    markerCount: 0,
    uncertaintyUpTo: 0,
  };
}

const required = (g: StepGroup) => Math.max(0, g.steps - g.avoidable);

function addLinear(acc: Totals, item: Item) {
  if (item.kind === "marker") {
    acc.markerCount += 1;
    return;
  }
  if (item.kind === "group" && item.group) {
    acc.groupCount += 1;
    const g = item.group;
    if (g.ambiguous) {
      addAmbiguous(acc, g);
    } else {
      addPhysical(acc, g);
      acc.avoidable += g.avoidable;
      const req = required(g);
      acc.minStairs += req;
      addExpected(acc, expectedGroup(g));
      if (g.direction === "up") acc.up += req;
      else acc.down += req;
    }
    for (const sub of item.subAmbiguous ?? []) addAmbiguous(acc, sub);
    return;
  }
  if (item.kind === "fork" && item.fork) {
    acc.forkCount += 1;
    let best: StepGroup | null = null;
    let bestReq = Infinity;
    let expLow = Infinity;
    let expHigh = -Infinity;
    for (const a of item.fork.alternatives) {
      if (a.ambiguous) {
        addAmbiguous(acc, a); // a maybe-path counts the same either way
        continue;
      }
      addPhysical(acc, a); // every path's stairs exist
      const req = required(a);
      if (req < bestReq) {
        bestReq = req;
        best = a;
      }
      const e = expectedGroup(a);
      expLow = Math.min(expLow, e);
      expHigh = Math.max(expHigh, e);
    }
    if (best) {
      acc.minStairs += bestReq;
      acc.avoidable += best.avoidable;
      acc.expectedLow += expLow;
      acc.expectedHigh += expHigh;
      if (best.direction === "up") acc.up += bestReq;
      else acc.down += bestReq;
    }
  }
}

// A scalar that contributes equally to both ends of the expected range (groups,
// ± steps — anything that isn't a fork/branch where the count can diverge).
function addExpected(acc: Totals, value: number) {
  acc.expectedLow += value;
  acc.expectedHigh += value;
}

// A real (non-±) flight: counts toward the total and its directional split.
function addPhysical(acc: Totals, g: StepGroup) {
  acc.totalStairs += g.steps;
  if (g.direction === "up") acc.upTotal += g.steps;
  else acc.downTotal += g.steps;
}

// A ± "maybe" flight: a step I wasn't sure to count. Held out of the total and
// folded into the expected count at half weight.
function addAmbiguous(acc: Totals, g: StepGroup) {
  acc.ambiguousStairs += g.steps;
  addExpected(acc, expectedAmbiguous(g));
}

function mergeAll(into: Totals, from: Totals) {
  into.totalStairs += from.totalStairs;
  into.upTotal += from.upTotal;
  into.downTotal += from.downTotal;
  into.ambiguousStairs += from.ambiguousStairs;
  into.avoidable += from.avoidable;
  into.groupCount += from.groupCount;
  into.forkCount += from.forkCount;
  into.branchCount += from.branchCount;
  into.markerCount += from.markerCount;
  into.uncertaintyUpTo += from.uncertaintyUpTo;
}

function linear(items: Item[]): Totals {
  const acc = empty();
  for (const item of items) addLinear(acc, item);
  return acc;
}

export function dayTotals(day: Day): Totals {
  const acc = empty();
  const items = day.items;
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.kind === "branch-open") {
      const lanes: Item[][] = [[]];
      i += 1;
      while (i < items.length && items[i].kind !== "branch-close") {
        if (items[i].kind === "lane-divider") lanes.push([]);
        else lanes[lanes.length - 1].push(items[i]);
        i += 1;
      }
      if (i < items.length) i += 1; // skip the closing ]]
      acc.branchCount += 1;
      const laneTotals = lanes.map(linear);
      let best: Totals | null = null;
      let expLow = Infinity;
      let expHigh = -Infinity;
      for (const lt of laneTotals) {
        mergeAll(acc, lt); // total counts every lane's stairs
        if (!best || lt.minStairs < best.minStairs) best = lt;
        expLow = Math.min(expLow, lt.expectedLow);
        expHigh = Math.max(expHigh, lt.expectedHigh);
      }
      if (best) {
        acc.minStairs += best.minStairs;
        acc.expectedLow += expLow;
        acc.expectedHigh += expHigh;
        acc.up += best.up;
        acc.down += best.down;
      }
      continue;
    }
    addLinear(acc, item);
    i += 1;
  }
  // Uncertainty band. A "could be N / up to N" note on a group means its count
  // is uncertain by |N − recorded|; that beats whatever ± figure was typed.
  const itemById = new Map(day.items.map((it) => [it.id, it]));
  for (const span of day.spans) {
    const text = span.uncertainty?.text ?? span.note ?? "";
    const altMag = couldBeMagnitude(text);
    if (altMag != null) {
      const recorded = itemById.get(span.startItemId)?.group?.steps ?? 0;
      acc.uncertaintyUpTo += Math.abs(altMag - recorded);
    } else if (span.uncertainty) {
      acc.uncertaintyUpTo += span.uncertainty.upTo;
    }
  }
  return acc;
}

function couldBeMagnitude(text: string): number | null {
  const m = text.match(/could be(?:\s+up\s+to)?\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

export function trailTotals(trail: Trail): Totals {
  const acc = empty();
  for (const day of trail.days) {
    const t = dayTotals(day);
    mergeAll(acc, t);
    acc.minStairs += t.minStairs;
    acc.expectedLow += t.expectedLow;
    acc.expectedHigh += t.expectedHigh;
    acc.up += t.up;
    acc.down += t.down;
  }
  return acc;
}
