/** The home page's link-preview loop. Second 16 is second 0 again. */
export const LOOP_SECONDS = 16;

export const FRAME = { width: 1200, height: 630 } as const;

/**
 * The film, in order: the flock signs "Boris." (the birds are the pen), lifts off into a
 * murmuration while the subtitle types, the humpback climbs through the murmuration up and to the
 * right as on the home page while the birds part around it, the subtitle backspaces, the flock
 * dives back and lifts the ink off the signature in the order it was written, and swoops round to
 * sign it again.
 */
export const BEATS = {
    writeOn: [0, 2.8],
    liftOff: [2.8, 3.9],
    typing: 3.0,
    whaleStarts: 1.6,
    whaleRate: 1.6,
    murmurEnds: 11.4,
    erasing: 11.1,
    writeOff: [12.0, 14.4],
} as const;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
export const smoothstep = (p: number) => p * p * (3 - 2 * p);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const wrap = (t: number) => ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
