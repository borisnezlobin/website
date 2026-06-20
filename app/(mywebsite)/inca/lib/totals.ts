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
  minStairs: number;
  ambiguousStairs: number; // ± "maybe" stairs — a band on totalStairs, never in min
  up: number; // climb on the minimum route
  down: number; // descent on the minimum route
  avoidable: number; // skippable stairs along the way
  groupCount: number;
  forkCount: number;
  branchCount: number;
  markerCount: number;
  uncertaintyUpTo: number;
}

function empty(): Totals {
  return {
    totalStairs: 0,
    minStairs: 0,
    ambiguousStairs: 0,
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
      acc.ambiguousStairs += g.steps;
    } else {
      acc.totalStairs += g.steps;
      acc.avoidable += g.avoidable;
      const req = required(g);
      acc.minStairs += req;
      if (g.direction === "up") acc.up += req;
      else acc.down += req;
    }
    for (const sub of item.subAmbiguous ?? []) acc.ambiguousStairs += sub.steps;
    return;
  }
  if (item.kind === "fork" && item.fork) {
    acc.forkCount += 1;
    let best: StepGroup | null = null;
    let bestReq = Infinity;
    for (const a of item.fork.alternatives) {
      if (a.ambiguous) {
        acc.ambiguousStairs += a.steps;
        continue;
      }
      acc.totalStairs += a.steps; // every path's stairs exist
      const req = required(a);
      if (req < bestReq) {
        bestReq = req;
        best = a;
      }
    }
    if (best) {
      acc.minStairs += bestReq;
      acc.avoidable += best.avoidable;
      if (best.direction === "up") acc.up += bestReq;
      else acc.down += bestReq;
    }
  }
}

function mergeAll(into: Totals, from: Totals) {
  into.totalStairs += from.totalStairs;
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
      for (const lt of laneTotals) {
        mergeAll(acc, lt); // total counts every lane's stairs
        if (!best || lt.minStairs < best.minStairs) best = lt;
      }
      if (best) {
        acc.minStairs += best.minStairs;
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
    acc.up += t.up;
    acc.down += t.down;
  }
  return acc;
}
