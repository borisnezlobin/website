import type { Mask, SpinRect } from "./index";

export type WakeTrail = {
    add(x: number, y: number, push: number, now: number): void;
    mask(now: number): Mask;
    glow(now: number): Mask;
    bounds(now: number): SpinRect | null;
};

const TRAIL_SAMPLES = 40;
const FADE_SECONDS = 2.1;
const REACH = 42;

const STROKE_SHARPNESS = 2;
const TROUGH_DENSITY = 0.34;
const PULSE_DENSITY = 1.1;
const TROUGH_GLOW = 0.5;
const PULSE_GLOW = 2.3;

const fadeAt = (age: number) => (age < 0 || age >= FADE_SECONDS ? 0 : (1 - age / FADE_SECONDS) ** 1.5);

export function createWakeTrail(reach = REACH): WakeTrail {
    const x = new Float64Array(TRAIL_SAMPLES);
    const y = new Float64Array(TRAIL_SAMPLES);
    const pulse = new Float64Array(TRAIL_SAMPLES);
    const born = new Float64Array(TRAIL_SAMPLES).fill(-Infinity);
    const reachSquared = reach * reach;
    let next = 0;

    const add = (px: number, py: number, push: number, now: number) => {
        x[next] = px;
        y[next] = py;
        pulse[next] = push ** STROKE_SHARPNESS;
        born[next] = now;
        next = (next + 1) % TRAIL_SAMPLES;
    };

    let askedX = NaN, askedY = NaN, askedAt = -1;
    let density = 0, brightness = 0;
    const lookAt = (cx: number, cy: number, now: number) => {
        if (cx === askedX && cy === askedY && now === askedAt) return;
        askedX = cx;
        askedY = cy;
        askedAt = now;
        density = 0;
        brightness = 0;
        for (let i = 0; i < TRAIL_SAMPLES; i++) {
            const fade = fadeAt(now - born[i]);
            if (fade <= 0) continue;
            const dx = cx - x[i], dy = cy - y[i];
            const near = 1 - (dx * dx + dy * dy) / reachSquared;
            if (near <= 0) continue;
            const lit = near * fade * (TROUGH_DENSITY + PULSE_DENSITY * pulse[i]);
            if (lit <= density) continue;
            density = lit;
            brightness = fade * (TROUGH_GLOW + PULSE_GLOW * pulse[i]);
        }
    };

    const mask = (now: number): Mask => (cx, cy) => {
        lookAt(cx, cy, now);
        return density > 1 ? 1 : density;
    };

    const glow = (now: number): Mask => (cx, cy) => {
        lookAt(cx, cy, now);
        return brightness;
    };

    const bounds = (now: number): SpinRect | null => {
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        for (let i = 0; i < TRAIL_SAMPLES; i++) {
            if (fadeAt(now - born[i]) <= 0) continue;
            if (x[i] < left) left = x[i];
            if (x[i] > right) right = x[i];
            if (y[i] < top) top = y[i];
            if (y[i] > bottom) bottom = y[i];
        }
        if (left > right) return null;
        return { x: left - reach, y: top - reach, w: right - left + reach * 2, h: bottom - top + reach * 2 };
    };

    return { add, mask, glow, bounds };
}
