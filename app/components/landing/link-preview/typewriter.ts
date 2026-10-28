import { BEATS } from "./timeline";

/** The hero's subtitle, typed the way hi-im-boris.tsx types it: 75 ms a letter, then a blinking caret. */
export const SUBTITLE = "1% better every day.";
const TYPE_SECONDS = 0.075;
const ERASE_SECONDS = 0.035;
const FONT = "26px 'Courier New', monospace";
const COLOR = "#3c3c3c";

function lettersShown(t: number) {
    const typed = Math.max(0, Math.floor((t - BEATS.typing) / TYPE_SECONDS));
    const erased = Math.max(0, Math.floor((t - BEATS.erasing) / ERASE_SECONDS));
    return Math.max(0, Math.min(SUBTITLE.length, typed) - erased);
}

/** Draws the subtitle centred on `x`; the caret sits after the last letter, steady while typing and blinking at rest. */
export function paintSubtitle(ctx: CanvasRenderingContext2D, t: number, x: number, y: number) {
    if (t < BEATS.typing - 0.4 || t > BEATS.erasing + SUBTITLE.length * ERASE_SECONDS + 0.4) return;
    const shown = lettersShown(t);
    ctx.font = FONT;
    ctx.fillStyle = COLOR;
    ctx.textBaseline = "alphabetic";
    const left = x - ctx.measureText(SUBTITLE).width / 2;
    ctx.fillText(SUBTITLE.slice(0, shown), left, y);
    const typing = (shown > 0 && shown < SUBTITLE.length) || t < BEATS.typing;
    if (!typing && (t * 2) % 2 > 1) return;
    ctx.fillRect(left + ctx.measureText(SUBTITLE.slice(0, shown)).width + 4, y - 21, 2, 26);
}
