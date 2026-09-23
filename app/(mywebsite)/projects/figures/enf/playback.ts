import { loopClock } from "../lib/motion";
import { HOUR_MHZ, WINDOW_SAMPLES } from "./series";

const SAMPLES_PER_SECOND = 8;
const FIRST_HEAD = 643;
const STILL_HEAD = 760;
const LAST_HEAD = HOUR_MHZ.length - 1;
const PERIOD_SECONDS = (LAST_HEAD - WINDOW_SAMPLES) / SAMPLES_PER_SECOND;

export type EnfPlayback = { head: number; envelope: number };

export const enfPlaybackAt = (seconds: number, still: boolean): EnfPlayback => {
    if (still) return { head: STILL_HEAD, envelope: 1 };
    const lead = (FIRST_HEAD - WINDOW_SAMPLES) / SAMPLES_PER_SECOND;
    const clock = loopClock(seconds + lead, PERIOD_SECONDS, 0.8, 1.2);
    return { head: WINDOW_SAMPLES + clock.elapsed * SAMPLES_PER_SECOND, envelope: clock.envelope };
};
