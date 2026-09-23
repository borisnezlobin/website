import { loopClock, smoothstep } from "../lib/motion";
import { DAYS_PER_SECOND, LOOP_DAYS, STILL_DAY } from "./rotation-model";

const LOOP_SECONDS = LOOP_DAYS / DAYS_PER_SECOND;
const MERIDIAN_FADE_SECONDS = 0.9;
const TEXTURE_BLEND_DAYS = 2;

export type SunClock = { days: number; echoDays: number; echoWeight: number; meridianWeight: number };

export const sunClockAt = (seconds: number, still: boolean): SunClock => {
    if (still) return { days: STILL_DAY, echoDays: STILL_DAY, echoWeight: 0, meridianWeight: 1 };
    const clock = loopClock(seconds + 1, LOOP_SECONDS, MERIDIAN_FADE_SECONDS, MERIDIAN_FADE_SECONDS);
    const days = clock.elapsed * DAYS_PER_SECOND;
    return {
        days,
        echoDays: days + LOOP_DAYS,
        echoWeight: 1 - smoothstep(0, TEXTURE_BLEND_DAYS, days),
        meridianWeight: clock.envelope,
    };
};
