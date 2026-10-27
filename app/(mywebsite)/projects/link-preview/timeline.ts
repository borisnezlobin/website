import { clamp } from "../canopy/random";

/** The link-preview loop. Everything in it is scheduled on this clock, so second 14 is second 0 again. */
export const LOOP_SECONDS = 14;

export const HEADLINES = ["I do stuff.", "I write systems software.", "I build cool things.", "I win competitions."] as const;

/** One gust carries one headline away and lands the next. `strength` is its peak extra lean in radians. */
export type Handover = { from: number; to: number; start: number; strength: number };

export const HANDOVERS: Handover[] = [
    { from: 0, to: 1, start: 1.8, strength: 0.2 },
    { from: 1, to: 2, start: 5.3, strength: 0.18 },
    { from: 2, to: 3, start: 8.8, strength: 0.3 },
    { from: 3, to: 0, start: 12.2, strength: 0.2 },
];

/** The third gust flushes the birds; this is when they go and when they are all back on their perches. */
export const FLUSH = { takeOff: 8.95, home: 13.4 } as const;

/** The gust builds this long before a handover starts, so the strands are already moving when the letters lift. */
export const GUST_LEAD = 0.35;
export const GUST_RISE = 0.55;
export const GUST_FALL = 1.5;

/** Letters peel off left to right over this long, the way the gust front crosses the line. */
export const PEEL_SECONDS = 0.6;
/** New letters land in a left-to-right wave between these two times after the handover starts. */
export const LANDING_WINDOW = [0.95, 1.5] as const;
export const FLIGHT_SECONDS = [1.0, 1.45] as const;

export const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start), 0, 1);

export const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

/** Any time folded onto the loop clock, from 0 up to LOOP_SECONDS. */
export const wrap = (t: number) => ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;

/** Seconds since `start` on the loop clock, looking back across the seam. */
export const since = (t: number, start: number) => wrap(t - start);
