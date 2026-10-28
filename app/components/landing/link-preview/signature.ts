import { neighboursOf, thin, type Bitmap } from "./skeleton";

/** Strokes this short off the end of a centre line are thinning noise, not pen strokes. */
const SPUR_PX = 5;
/** Flying between strokes counts this much toward the pen's time per pixel, against 1 for inking. */
const LIFT_COST = 0.45;

export type PenPoint = { x: number; y: number; ink: number; pen: number };

/**
 * A word set in a script face, turned into something a pen can write: the centre lines of its
 * strokes in writing order, and for every inked pixel how far along the strokes the pen has to be
 * before it is inked.
 */
export type Signature = {
    box: { left: number; top: number; width: number; height: number };
    alpha: Uint8Array;
    /** Ink length at which each pixel is written; Infinity off the letters. */
    inkAt: Float32Array;
    totalInk: number;
    totalPen: number;
    track: PenPoint[];
};

function rasterise(text: string, font: string, x: number, y: number, frame: { width: number; height: number }) {
    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
    const metrics = ctx.measureText(text);
    const left = Math.max(0, Math.floor(x - metrics.actualBoundingBoxLeft) - 4);
    const top = Math.max(0, Math.floor(y - metrics.actualBoundingBoxAscent) - 4);
    const width = Math.min(frame.width - left, Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + 8);
    const height = Math.min(frame.height - top, Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 8);
    const pixels = ctx.getImageData(left, top, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
    return { left, top, width, height, alpha };
}

/** Trims the short whiskers thinning leaves at stroke ends and corners. */
function pruneSpurs(map: Bitmap) {
    for (let round = 0; round < SPUR_PX; round++) {
        const ends: number[] = [];
        map.on.forEach((value, index) => { if (value && neighboursOf(map, index).length === 1) ends.push(index); });
        ends.forEach((index) => { map.on[index] = 0; });
    }
}

function components(map: Bitmap) {
    const label = new Int32Array(map.on.length).fill(-1);
    const groups: number[][] = [];
    map.on.forEach((value, seed) => {
        if (!value || label[seed] >= 0) return;
        const group: number[] = [];
        const queue = [seed];
        label[seed] = groups.length;
        while (queue.length) {
            const index = queue.pop()!;
            group.push(index);
            for (const next of neighboursOf(map, index)) if (label[next] < 0) { label[next] = groups.length; queue.push(next); }
        }
        groups.push(group);
    });
    const leftmost = (group: number[]) => Math.min(...group.map((index) => index % map.width));
    return groups.filter((group) => group.length > SPUR_PX * 2).sort((a, b) => leftmost(a) - leftmost(b));
}

type Walk = { map: Bitmap; seen: Uint8Array };

const xy = (map: Bitmap, index: number) => ({ x: index % map.width, y: Math.floor(index / map.width) });

/** From `index`, keeps going the way the line already goes, so a stroke runs through crossings instead of turning at them. */
function nextStep(walk: Walk, stroke: number[]) {
    const here = xy(walk.map, stroke[stroke.length - 1]);
    const back = xy(walk.map, stroke[Math.max(0, stroke.length - 5)]);
    const headingX = here.x - back.x, headingY = here.y - back.y;
    let best = -1, bestTurn = Infinity;
    for (const next of neighboursOf(walk.map, stroke[stroke.length - 1])) {
        if (walk.seen[next]) continue;
        const step = xy(walk.map, next);
        const dx = step.x - here.x, dy = step.y - here.y;
        const turn = stroke.length < 2 ? 0 : -(dx * headingX + dy * headingY) / (Math.hypot(dx, dy) * (Math.hypot(headingX, headingY) || 1));
        if (turn < bestTurn) { bestTurn = turn; best = next; }
    }
    return best;
}

function strokeFrom(walk: Walk, start: number) {
    const stroke = [start];
    walk.seen[start] = 1;
    for (let next = nextStep(walk, stroke); next >= 0; next = nextStep(walk, stroke)) {
        walk.seen[next] = 1;
        stroke.push(next);
    }
    return stroke;
}

/** Where to start a component: the leftmost end of a line, or the leftmost pixel if it is a closed loop. */
function startOf(map: Bitmap, group: number[]) {
    const ends = group.filter((index) => neighboursOf(map, index).length === 1);
    const pool = ends.length ? ends : group;
    return pool.reduce((best, index) => (index % map.width < best % map.width ? index : best));
}

/** The unwritten pixel nearest the pen that touches ink already written: where a branch leaves the line. */
function branchNear(walk: Walk, group: number[], pen: { x: number; y: number }) {
    let best = -1, bestDistance = Infinity;
    for (const index of group) {
        if (walk.seen[index] || !neighboursOf(walk.map, index).some((next) => walk.seen[next])) continue;
        const p = xy(walk.map, index);
        const distance = Math.hypot(p.x - pen.x, p.y - pen.y);
        if (distance < bestDistance) { bestDistance = distance; best = index; }
    }
    return best;
}

function strokesOf(map: Bitmap) {
    const walk: Walk = { map, seen: new Uint8Array(map.on.length) };
    const strokes: number[][] = [];
    for (const group of components(map)) {
        strokes.push(strokeFrom(walk, startOf(map, group)));
        for (let branch = branchNear(walk, group, xy(map, strokes[strokes.length - 1].at(-1)!)); branch >= 0; branch = branchNear(walk, group, xy(map, strokes[strokes.length - 1].at(-1)!))) {
            strokes.push(strokeFrom(walk, branch));
        }
    }
    return strokes;
}

/** Lays the strokes end to end, measuring ink (pixels written) and pen travel (ink plus the cheaper flights between strokes). */
function trackOf(map: Bitmap, strokes: number[][]) {
    const track: PenPoint[] = [];
    const order: number[] = [];
    const inkAtSkeleton = new Float32Array(map.on.length).fill(Infinity);
    let ink = 0, pen = 0;
    for (const stroke of strokes) {
        stroke.forEach((index, k) => {
            const p = xy(map, index);
            const last = track[track.length - 1];
            const step = last ? Math.hypot(p.x + map.left - last.x, p.y + map.top - last.y) : 0;
            const inking = k > 0;
            if (inking) ink += step;
            pen += inking ? step : step * LIFT_COST;
            inkAtSkeleton[index] = ink;
            order.push(index);
            track.push({ x: p.x + map.left, y: p.y + map.top, ink, pen });
        });
    }
    return { track, order, inkAtSkeleton, totalInk: ink, totalPen: pen };
}

/** How far each inked pixel is from the edge of its letter, counted in pixel steps (a chamfer distance). */
function depthInside(solid: Bitmap) {
    const depth = new Float32Array(solid.on.length).fill(Infinity);
    let frontier: number[] = [];
    solid.on.forEach((value, index) => {
        if (!value) return;
        if (neighboursOf(solid, index).length < 8) { depth[index] = 1; frontier.push(index); }
    });
    for (let level = 2; frontier.length; level++) {
        const next: number[] = [];
        for (const index of frontier) {
            for (const neighbour of neighboursOf(solid, index)) {
                if (depth[neighbour] !== Infinity) continue;
                depth[neighbour] = level;
                next.push(neighbour);
            }
        }
        frontier = next;
    }
    return depth;
}

/**
 * The pen lays ink as it goes: at each centre-line pixel, in writing order, it inks a disc as wide
 * as the letter is thick there. A pixel belongs to the first stroke that inks it, so lifting the
 * ink in the same order clears every pixel exactly once and leaves nothing behind.
 */
function depositInk(solid: Bitmap, track: number[], inkAtSkeleton: Float32Array) {
    const depth = depthInside(solid);
    const inkAt = new Float32Array(solid.on.length).fill(Infinity);
    for (const index of track) stampNib(solid, inkAt, index, depth[index] + 1, inkAtSkeleton[index]);
    return inkAt;
}

/** Inks the unwritten letter pixels within `reach` of centre-line pixel `index`. */
function stampNib(solid: Bitmap, inkAt: Float32Array, index: number, reach: number, ink: number) {
    const cx = index % solid.width, cy = Math.floor(index / solid.width);
    const r = Math.ceil(reach);
    for (let y = Math.max(0, cy - r); y <= Math.min(solid.height - 1, cy + r); y++) {
        for (let x = Math.max(0, cx - r); x <= Math.min(solid.width - 1, cx + r); x++) {
            const at = y * solid.width + x;
            const inside = (x - cx) ** 2 + (y - cy) ** 2 <= reach * reach;
            if (inside && solid.on[at] && inkAt[at] === Infinity) inkAt[at] = ink;
        }
    }
}

/** Any pixel the discs missed (a sharp outside corner) takes the ink of the inked pixel next to it. */
function spreadInk(map: Bitmap, alpha: Uint8Array, deposited: Float32Array) {
    const inkAt = deposited.slice();
    const solid: Bitmap = { ...map, on: Uint8Array.from(alpha, (value) => (value > 0 ? 1 : 0)) };
    let frontier = Array.from(inkAt.keys()).filter((index) => Number.isFinite(inkAt[index]));
    while (frontier.length) {
        const next: number[] = [];
        for (const index of frontier) {
            for (const neighbour of neighboursOf(solid, index)) {
                if (Number.isFinite(inkAt[neighbour])) continue;
                inkAt[neighbour] = inkAt[index];
                next.push(neighbour);
            }
        }
        frontier = next;
    }
    return inkAt;
}

export function traceSignature(text: string, font: string, baseline: { x: number; y: number }, frame: { width: number; height: number }): Signature {
    const raster = rasterise(text, font, baseline.x, baseline.y, frame);
    const map: Bitmap = { width: raster.width, height: raster.height, left: raster.left, top: raster.top, on: Uint8Array.from(raster.alpha, (value) => (value > 110 ? 1 : 0)) };
    const centre = thin(map);
    pruneSpurs(centre);
    const { track, order, inkAtSkeleton, totalInk, totalPen } = trackOf(centre, strokesOf(centre));
    const solid: Bitmap = { ...map, on: Uint8Array.from(raster.alpha, (value) => (value > 0 ? 1 : 0)) };
    return {
        box: { left: raster.left, top: raster.top, width: raster.width, height: raster.height },
        alpha: raster.alpha,
        inkAt: spreadInk(centre, raster.alpha, depositInk(solid, order, inkAtSkeleton)),
        totalInk,
        totalPen,
        track,
    };
}

/** Where the pen is once it has travelled `pen` along the track. */
export function penAt(signature: Signature, pen: number) {
    const { track } = signature;
    if (pen <= 0) return track[0];
    if (pen >= signature.totalPen) return track[track.length - 1];
    let low = 0, high = track.length - 1;
    while (high - low > 1) {
        const middle = (low + high) >> 1;
        if (track[middle].pen <= pen) low = middle;
        else high = middle;
    }
    return track[low];
}
