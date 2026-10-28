import { penAt, type Signature } from "./signature";
import { BEATS, LOOP_SECONDS, span, wrap } from "./timeline";

type Key = [number, number, number];
export type Point = { x: number; y: number };

function catmullRom(p0: number, p1: number, p2: number, p3: number, u: number) {
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}

function along(keys: Key[], t: number): Point {
    const last = keys.length - 1;
    let k = 0;
    while (k < last - 1 && t > keys[k + 1][0]) k++;
    const u = Math.min(1, Math.max(0, (t - keys[k][0]) / (keys[k + 1][0] - keys[k][0])));
    const key = (i: number) => keys[Math.max(0, Math.min(last, i))];
    return {
        x: catmullRom(key(k - 1)[1], key(k)[1], key(k + 1)[1], key(k + 2)[1], u),
        y: catmullRom(key(k - 1)[2], key(k)[2], key(k + 1)[2], key(k + 2)[2], u),
    };
}

/** Where the murmuration wheels while the whale climbs: high on the card, drifting the other way to the whale. */
const MURMUR: Key[] = [
    [BEATS.liftOff[1], 940, 230],
    [5.6, 780, 190],
    [7.4, 540, 175],
    [9.2, 340, 215],
    [BEATS.murmurEnds, 420, 265],
];

export function murmurCentre(t: number) {
    return along(MURMUR, Math.min(Math.max(t, MURMUR[0][0]), MURMUR[MURMUR.length - 1][0]));
}

/**
 * The head of the flock over the whole loop: it is the pen while the signature is written and
 * lifted, and flies the joins in between. The pen keeps one speed from end to end of a pass, so
 * the flock arrives and leaves at speed instead of piling up where it would have slowed. Every
 * bird in a ribbon flies the head's path a little later than the head.
 */
export function createHeadPath(signature: Signature) {
    const start = penAt(signature, 0);
    const end = penAt(signature, signature.totalPen);
    const writing = (t: number, window: readonly [number, number]) => penAt(signature, signature.totalPen * span(t, window[0], window[1]));
    const liftOff: Key[] = [[BEATS.liftOff[0] - 0.2, end.x - 40, end.y], [BEATS.liftOff[0], end.x, end.y], [3.35, end.x + 140, end.y - 170], ...MURMUR.slice(0, 2)];
    const dive: Key[] = [...MURMUR.slice(-2), [BEATS.writeOff[0] - 0.25, start.x - 120, start.y - 60], [BEATS.writeOff[0], start.x, start.y], [BEATS.writeOff[0] + 0.2, start.x + 30, start.y]];
    const swoop: Key[] = [
        [BEATS.writeOff[1] - 0.2, end.x - 40, end.y],
        [BEATS.writeOff[1], end.x, end.y],
        [BEATS.writeOff[1] + 0.45, end.x + 90, end.y - 210],
        [BEATS.writeOff[1] + 0.95, 620, 110],
        [LOOP_SECONDS - 0.3, start.x - 160, start.y - 130],
        [LOOP_SECONDS, start.x, start.y],
        [LOOP_SECONDS + 0.2, start.x + 30, start.y],
    ];

    return (time: number): Point => {
        const t = wrap(time);
        if (t <= BEATS.writeOn[1]) return writing(t, BEATS.writeOn);
        if (t <= BEATS.liftOff[1]) return along(liftOff, t);
        if (t <= BEATS.murmurEnds) return murmurCentre(t);
        if (t <= BEATS.writeOff[0]) return along(dive, t);
        if (t <= BEATS.writeOff[1]) return writing(t, BEATS.writeOff);
        return along(swoop, t);
    };
}

/**
 * How far the pen has inked (`to`) and lifted (`from`) the signature at time t, in ink length.
 * `drying` runs on past the end of the ink at the pen's own pace once it stops, so the last
 * strokes dry as long after they were written as the first ones did.
 */
export function inkWindow(signature: Signature, t: number) {
    const inkAt = (window: readonly [number, number]) => penAt(signature, signature.totalPen * span(t, window[0], window[1])).ink;
    const lifting = t >= BEATS.writeOff[0];
    const to = inkAt(BEATS.writeOn);
    const pace = signature.totalInk / (BEATS.writeOn[1] - BEATS.writeOn[0]);
    return { from: lifting ? inkAt(BEATS.writeOff) : 0, to, drying: to + Math.max(0, t - BEATS.writeOn[1]) * pace };
}
