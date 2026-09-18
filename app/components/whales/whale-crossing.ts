import type { WhaleBehaviorPath, WhaleStyleCatalog } from "./whale-catalog";
import { scheduleForCrossing } from "./whale-schedule";

export type WhalePlacement = { seconds: number; x: number; y: number };

export type WhaleCrossing = {
    schedule: string[];
    boundaries: number[];
    totalSeconds: number;
    frames: Keyframe[];
    points: WhalePlacement[];
};

export function placeAt(crossing: WhaleCrossing, seconds: number) {
    const points = crossing.points;
    let index = 0;
    while (index + 1 < points.length && points[index + 1].seconds <= seconds) index += 1;
    const from = points[index];
    const to = points[Math.min(index + 1, points.length - 1)];
    const span = to.seconds - from.seconds;
    const part = span > 0 ? Math.min(Math.max((seconds - from.seconds) / span, 0), 1) : 0;
    return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part };
}

type CrossingInput = {
    catalog: WhaleStyleCatalog;
    laneWidth: number;
    frameWidth: number;
    schedule?: string[];
    startHeight?: number;
    mirrored?: boolean;
};

const OFFSCREEN_MARGIN_PIXELS = 2;

function travelOf(path: WhaleBehaviorPath) {
    return Math.max(path.cycle[0] - path.steps[0][0], 0.05);
}

function laneEnds(catalog: WhaleStyleCatalog, mirrored: boolean, laneWidth: number, frameWidth: number) {
    const paths = catalog.behaviors;
    const representative = paths[Object.keys(paths)[0]];
    const body = frameWidth * representative.bodyFraction;
    const laneBodyLengths = laneWidth / body;
    const allInsets = Object.values(paths).map((path) => path.hitInset);
    const rightInset = Math.min(...allInsets.map((inset) => inset[1]));
    const leftInset = Math.min(...allInsets.map((inset) => inset[3]));
    const visibleLeftInset = (mirrored ? rightInset : leftInset) / 100 / representative.bodyFraction;
    const visibleRightEdge = (1 - (mirrored ? leftInset : rightInset) / 100) / representative.bodyFraction;
    const offscreenMargin = OFFSCREEN_MARGIN_PIXELS / body;
    const outside = -visibleRightEdge - offscreenMargin;
    const across = laneBodyLengths - visibleLeftInset + offscreenMargin;
    const start = mirrored ? across : outside;
    const finish = mirrored ? outside : across;
    return { body, start, distance: Math.abs(finish - start), facing: mirrored ? -1 : 1 };
}

function scheduleReaching(paths: Record<string, WhaleBehaviorPath>, wanted: string[] | undefined, distance: number) {
    const order = [...(wanted ?? scheduleForCrossing(paths, distance))];
    const filler = "cruise_loop" in paths ? "cruise_loop" : order[0];
    let reach = order.reduce((sum, behavior) => sum + travelOf(paths[behavior]), 0);
    while (reach < distance) {
        order.push(filler);
        reach += travelOf(paths[filler]);
    }
    return order;
}

export function planCrossing({ catalog, laneWidth, frameWidth, schedule, startHeight = 0, mirrored }: CrossingInput): WhaleCrossing {
    const paths = catalog.behaviors;
    const goesLeft = mirrored ?? catalog.mirrored;
    const { body, start, distance: crossingDistance, facing } = laneEnds(catalog, goesLeft, laneWidth, frameWidth);
    const order = scheduleReaching(paths, schedule, crossingDistance);

    const placed: { seconds: number; x: number; y: number }[] = [];
    const boundaries: number[] = [];
    let elapsedSeconds = 0;
    let travelled = 0;
    let height = startHeight;
    let endSeconds = -1;
    for (const behavior of order) {
        const path = paths[behavior];
        const [firstX, firstY] = path.steps[0];
        path.steps.forEach(([x, y], index) => {
            const seconds = elapsedSeconds + path.frameOffsets[index] * path.seconds;
            const along = travelled + x - firstX;
            placed.push({ seconds, x: start + facing * along, y: height + y - firstY });
            if (endSeconds < 0 && along >= crossingDistance) endSeconds = seconds;
        });
        elapsedSeconds += path.seconds;
        travelled += path.cycle[0] - firstX;
        height += path.cycle[1] - firstY;
        boundaries.push(elapsedSeconds);
        if (endSeconds >= 0) break;
    }
    if (endSeconds < 0) {
        endSeconds = elapsedSeconds;
        placed.push({ seconds: elapsedSeconds, x: start + facing * travelled, y: height });
    }

    const points: WhalePlacement[] = placed
        .filter((point) => point.seconds <= endSeconds)
        .map((point) => ({ seconds: point.seconds, x: point.x * body, y: point.y * body }));
    const frames: Keyframe[] = points.map((point) => ({
        offset: Math.min(point.seconds / endSeconds, 1),
        transform: `translate(${point.x}px, ${point.y}px)`,
    }));
    frames[frames.length - 1].offset = 1;

    return {
        schedule: order.slice(0, boundaries.length),
        boundaries,
        totalSeconds: endSeconds,
        frames,
        points,
    };
}
