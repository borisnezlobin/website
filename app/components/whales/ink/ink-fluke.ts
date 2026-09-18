import type { InkCloud } from "./ink-cloud";

const FLUKE_SLICE = 0.06;

export type FlukePoint = [number, number];

export type FlukeFinder = {
    at(frame: number): FlukePoint | null;
};

type Extent = { left: number; right: number };

function lengthOn(points: Float32Array, start: number, count: number): Extent {
    let left = Infinity;
    let right = -Infinity;
    for (let index = 0; index < count; index += 1) {
        const x = points[start + index * 2];
        if (x < left) left = x;
        if (x > right) right = x;
    }
    return { left, right };
}

function middleOfTail(points: Float32Array, start: number, count: number, behind: number) {
    let sum = 0;
    let found = 0;
    for (let index = 0; index < count; index += 1) {
        if (points[start + index * 2] > behind) continue;
        sum += points[start + index * 2 + 1];
        found += 1;
    }
    return found ? sum / found : NaN;
}

export function makeFlukeFinder(cloud: InkCloud): FlukeFinder {
    const { points, count, frames, size } = cloud;
    const found = new Float32Array(frames * 2).fill(NaN);
    const measured = new Uint8Array(frames);

    return {
        at(frame) {
            if (!(frame >= 0) || frame >= frames) return null;
            const whole = Math.floor(frame);
            if (!measured[whole]) {
                const start = whole * count * 2;
                const { left, right } = lengthOn(points, start, count);
                found[whole * 2] = left / size[0];
                found[whole * 2 + 1] = middleOfTail(points, start, count, left + (right - left) * FLUKE_SLICE) / size[1];
                measured[whole] = 1;
            }
            const x = found[whole * 2];
            const y = found[whole * 2 + 1];
            return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
        },
    };
}
