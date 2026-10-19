import type { ArborOptions, LimbSeed } from "../arbor/growth";
import type { HangingOptions } from "../hanging";
import { clamp } from "../random";

export const isNarrow = (width: number) => width < 700;

export function cherryScale(width: number, height: number) {
    return clamp(Math.min(width / 1440, height / 850), 0.5, 1.2);
}

/** One old trunk-limb sweeping in from the left, and a second, lighter one from the top right. */
export function cherrySeeds(width: number, height: number): LimbSeed[] {
    const scale = cherryScale(width, height);
    if (isNarrow(width)) {
        return [
            { x: -0.14 * width, y: 0.2 * height, angle: -0.36, width: 46 * scale, length: width * 1.55 },
            { x: 1.1 * width, y: -0.02 * height, angle: Math.PI + 0.05, width: 26 * scale, length: width * 0.9 },
        ];
    }
    return [
        { x: -0.05 * width, y: 0.26 * height, angle: -0.5, width: 64 * scale, length: width * 0.8 },
        { x: 1.05 * width, y: 0.05 * height, angle: Math.PI - 0.1, width: 38 * scale, length: width * 0.5 },
    ];
}

export function cherryGrowth(width: number, height: number): ArborOptions {
    const scale = Math.max(0.65, cherryScale(width, height));
    return {
        segment: 6,
        spacing: [30 * scale, 70 * scale],
        childWidth: [0.32, 0.6],
        childLength: [0.35, 0.7],
        spread: [0.45, 1.0],
        rise: 0.35,
        droop: 0.018,
        wiggle: 0.1,
        maxDepth: 2,
        minWidth: 1,
        rigidWidth: 16,
        pliancy: 1,
        limbPliancy: 0.35,
        maxFlex: 52,
        floor: height * 0.3,
        hangingWidth: 10,
    };
}

export function cherryHanging(width: number, height: number): HangingOptions {
    return {
        count: Math.round(width / (isNarrow(width) ? 4 : 4.6)),
        maxWoodWidth: 7,
        rootFloor: height * 0.3,
        hemline: [0.3, 0.47],
        minLength: 36,
        backShare: 0.3,
        clumping: 0.35,
    };
}
