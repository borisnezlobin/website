import type { ArborOptions, LimbSeed } from "@/app/(mywebsite)/projects/canopy/arbor/growth";
import type { HangingOptions } from "@/app/(mywebsite)/projects/canopy/hanging";
import { clamp } from "@/app/(mywebsite)/projects/canopy/random";

export const isNarrow = (width: number) => width < 700;

export function willowScale(width: number, height: number) {
    return clamp(Math.min(width / 1440, height / 850), 0.5, 1.2);
}

/** Three limbs reach in from the top-left and top edge; a fourth leans in from the right. */
export function willowSeeds(width: number, height: number): LimbSeed[] {
    const scale = willowScale(width, height);
    if (isNarrow(width)) {
        return [
            { x: -0.12 * width, y: 0.14 * height, angle: -0.42, width: 44 * scale, length: width * 1.5 },
            { x: 1.12 * width, y: 0.02 * height, angle: Math.PI + 0.18, width: 30 * scale, length: width * 0.95 },
        ];
    }
    return [
        { x: -0.05 * width, y: 0.2 * height, angle: -0.42, width: 58 * scale, length: width * 0.86 },
        { x: 0.3 * width, y: -0.05 * height, angle: -0.12, width: 30 * scale, length: width * 0.6 },
        { x: 1.05 * width, y: 0.06 * height, angle: Math.PI + 0.12, width: 36 * scale, length: width * 0.45 },
    ];
}

export function willowGrowth(width: number, height: number): ArborOptions {
    const scale = Math.max(0.65, willowScale(width, height));
    return {
        segment: 6,
        spacing: [34 * scale, 80 * scale],
        childWidth: [0.3, 0.55],
        childLength: [0.4, 0.75],
        spread: [0.4, 0.9],
        rise: 0.3,
        droop: 0.02,
        wiggle: 0.07,
        maxDepth: 2,
        minWidth: 1,
        rigidWidth: 7,
        pliancy: 0.55,
        maxFlex: 28,
        floor: height * 0.3,
        hangingWidth: 12,
    };
}

export function willowHanging(width: number, height: number): HangingOptions {
    return {
        count: Math.round(width / (isNarrow(width) ? 2.8 : 3.1)),
        maxWoodWidth: 6,
        rootFloor: height * 0.34,
        hemline: [0.34, 0.48],
        minLength: 30,
        backShare: 0.38,
        clumping: 0.45,
    };
}
