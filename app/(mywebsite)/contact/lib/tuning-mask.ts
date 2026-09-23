import type { Mask } from "@/app/lib/spin-drive";
import { SAMPLES_PER_CELL, type GlyphGrids } from "./glyph-masks";
import { smoothstep } from "./smoothstep";

const FIELD_DENSITY = 0.06;
const STATIC_DENSITY = 0.6;
const STATIC_BUCKET_MS = 50;
const GLYPH_GLOW = 3.2;
const LOCK_HOLD = 0.04;
const LOCK_RELEASE = 0.45;
const EDGE_FADE_SHARE = 0.22;

export type Tuning = {
    position: number;
    grids: GlyphGrids | null;
    station: number;
    lock: number;
    bucket: number;
};

export function createTuning(position: number): Tuning {
    return { position, grids: null, station: Math.round(position), lock: 1, bucket: 0 };
}

export function lockAt(position: number) {
    const offStation = Math.abs(position - Math.round(position));
    return 1 - smoothstep(LOCK_HOLD, LOCK_RELEASE, offStation);
}

export function advanceTuning(tuning: Tuning, t: number) {
    tuning.station = Math.round(tuning.position);
    tuning.lock = lockAt(tuning.position);
    tuning.bucket = Math.floor((t * 1000) / STATIC_BUCKET_MS);
}

const noise = (x: number, y: number, bucket: number, salt: number) => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + bucket * 37.719 + salt) * 43758.5453;
    return v - Math.floor(v);
};

const sampleIndex = (cx: number, cell: number) => Math.floor((cx * SAMPLES_PER_CELL) / cell + 1e-3);

function glyphAt(tuning: Tuning, gx: number, gy: number) {
    const grids = tuning.grids;
    if (!grids || gx < 0 || gy < 0 || gx >= grids.cols || gy >= grids.rows) return 0;
    return grids.stations[tuning.station]?.[gy * grids.cols + gx] ?? 0;
}

const edgeFade = (cx: number, cy: number, w: number, h: number) => {
    const reach = Math.min(w, h) * EDGE_FADE_SHARE;
    const nearest = Math.min(cx, w - cx, cy, h - cy);
    return smoothstep(0, reach, nearest);
};

export function tuningMasks(tuning: Tuning, cell: number): { density: Mask; brightness: Mask } {
    const density: Mask = (cx, cy, w, h) => {
        const gx = sampleIndex(cx, cell), gy = sampleIndex(cy, cell);
        const fade = edgeFade(cx, cy, w, h);
        const glyph = glyphAt(tuning, gx, gy);
        const locked = glyph + FIELD_DENSITY * fade * (1 - glyph);
        if (tuning.lock >= 1) return locked;
        const flicker = noise(gx, gy, tuning.bucket, 0) * STATIC_DENSITY * fade;
        return tuning.lock * locked + (1 - tuning.lock) * flicker;
    };
    const brightness: Mask = (cx, cy) => {
        const gx = sampleIndex(cx, cell), gy = sampleIndex(cy, cell);
        const glow = 1 + GLYPH_GLOW * glyphAt(tuning, gx, gy);
        if (tuning.lock >= 1) return glow;
        const crackle = 0.5 + 2.5 * noise(gx, gy, tuning.bucket, 91.7) ** 2;
        return tuning.lock * glow + (1 - tuning.lock) * crackle;
    };
    return { density, brightness };
}
