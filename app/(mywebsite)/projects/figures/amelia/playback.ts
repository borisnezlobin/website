import { loopClock } from "../lib/motion";

export const SWEEP_SECONDS = 30;
const STILL_PHASE = 0.62;
const FADE_IN_SECONDS = 0.6;
const FADE_OUT_SECONDS = 1.8;

export type Playback = { phase: number; playheadAlpha: number; memory: number };

export const playbackAt = (seconds: number, still: boolean): Playback => {
    if (still) return { phase: STILL_PHASE, playheadAlpha: 1, memory: 1 };
    const clock = loopClock(seconds + SWEEP_SECONDS * 0.08, SWEEP_SECONDS, FADE_IN_SECONDS, FADE_OUT_SECONDS);
    return { phase: clock.phase, playheadAlpha: clock.envelope, memory: Math.min(1, clock.envelope * 1.2) };
};
