import { noise1, smoothstep } from "../canopy/random";
import type { Wind } from "../canopy/wind";
import { GUST_FALL, GUST_LEAD, GUST_RISE, HANDOVERS, LOOP_SECONDS, since } from "./timeline";

const BREEZE = 0.03;
const SWELL = 0.022;
/** A gust reaches the right edge this long after the left one. */
const CROSSING_SECONDS = 0.45;
const PATCHINESS = 0.3;
const PATCH_PX = 700;
const WOOD_EDDY_SHARE = 0.35;
const EDDY_STILL = 0.02;
const EDDY_PER_GUST = 0.3;

/**
 * Eddies as travelling waves whose frequencies are whole numbers of cycles per loop, so the
 * wind at second 14 is the wind at second 0. Each drifts downwind at its own speed.
 */
const EDDIES = [
    { cycles: 3, px: 260, weight: 0.6, phase: 0.4 },
    { cycles: 5, px: 150, weight: 0.4, phase: 2.1 },
    { cycles: 8, px: 95, weight: 0.25, phase: 4.7 },
];

function gustEnvelope(age: number) {
    if (age < GUST_RISE) return smoothstep(0, GUST_RISE, age);
    const past = (age - GUST_RISE) / GUST_FALL;
    return Math.exp(-past * past);
}

/**
 * The canopy's wind, scheduled instead of random: a steady breeze that swells once a loop, and
 * one gust per headline handover, each crossing the tree from left to right.
 */
export function createLoopWind(): Wind {
    let width = 1;
    let time = 0;

    const gustAt = (x: number) => {
        const arrival = (Math.min(Math.max(x, 0), width) / width) * CROSSING_SECONDS;
        let lean = 0;
        HANDOVERS.forEach((handover, index) => {
            const patch = 1 + PATCHINESS * (noise1(x / PATCH_PX + index * 13.7) * 2 - 1);
            lean += handover.strength * patch * gustEnvelope(since(time, handover.start - GUST_LEAD + arrival));
        });
        return lean;
    };

    const eddyAt = (x: number, gust: number) => {
        const loopPhase = (time / LOOP_SECONDS) * Math.PI * 2;
        let swirl = 0;
        for (const eddy of EDDIES) swirl += Math.sin(loopPhase * eddy.cycles - x / eddy.px + eddy.phase) * eddy.weight;
        return swirl * (EDDY_STILL + EDDY_PER_GUST * gust);
    };

    const sharedLean = () => BREEZE + Math.sin((time / LOOP_SECONDS) * Math.PI * 2) * SWELL;

    return {
        update(dt: number) {
            time += dt;
        },
        lean(x: number) {
            const gust = gustAt(x);
            return sharedLean() + gust + eddyAt(x, gust);
        },
        woodLean(x: number) {
            const gust = gustAt(x);
            return sharedLean() + gust + eddyAt(x, gust) * WOOD_EDDY_SHARE;
        },
        resize(nextWidth: number) {
            width = Math.max(1, nextWidth);
        },
    };
}
