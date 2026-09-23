import type { SpinColors } from "@/app/lib/spin-drive";
import { drawLabel } from "../lib/canvas-text";
import { labelSize } from "../lib/frame-layout";
import { DAY_MHZ, DAY_SCALE_MHZ, DAY_STEP_SECONDS, HOUR_MHZ, HOUR_START_SECONDS, SECONDS_PER_DAY } from "./series";
import type { EnfLayout } from "./geometry";

const dayX = (layout: EnfLayout, seconds: number) => layout.left + (seconds / SECONDS_PER_DAY) * (layout.right - layout.left);

const HOUR_FIRST_STEP = HOUR_START_SECONDS / DAY_STEP_SECONDS;
const HOUR_LAST_STEP = HOUR_FIRST_STEP + HOUR_MHZ.length / DAY_STEP_SECONDS;

const drawDayLine = (ctx: CanvasRenderingContext2D, layout: EnfLayout, top: number, bottom: number, from: number, to: number) => {
    const mid = (top + bottom) / 2, half = (bottom - top) / 2;
    ctx.beginPath();
    for (let i = from; i <= Math.min(to, DAY_MHZ.length - 1); i++) {
        const x = dayX(layout, i * DAY_STEP_SECONDS), y = mid - (DAY_MHZ[i] / DAY_SCALE_MHZ) * half;
        if (i === from) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
};

const drawHourBracket = (ctx: CanvasRenderingContext2D, layout: EnfLayout, bottom: number, head: number, colors: SpinColors) => {
    const from = dayX(layout, HOUR_START_SECONDS), to = dayX(layout, HOUR_START_SECONDS + HOUR_MHZ.length);
    const y = Math.round(bottom + 5) + 0.5;
    ctx.strokeStyle = colors.glow;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(from, y - 4);
    ctx.lineTo(from, y);
    ctx.lineTo(to, y);
    ctx.lineTo(to, y - 4);
    ctx.stroke();
    ctx.fillStyle = colors.red;
    ctx.globalAlpha = 1;
    ctx.fillRect(dayX(layout, HOUR_START_SECONDS + head) - 0.75, y - 5, 1.5, 7);
};

export const drawDayStrip = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors) => {
    if (!layout.strip) return;
    const { top, bottom } = layout.strip;
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.45;
    drawDayLine(ctx, layout, top, bottom, 0, DAY_MHZ.length - 1);
    ctx.strokeStyle = colors.glow;
    ctx.globalAlpha = 0.95;
    drawDayLine(ctx, layout, top, bottom, HOUR_FIRST_STEP, HOUR_LAST_STEP);
    drawHourBracket(ctx, layout, bottom, head, colors);
    const size = labelSize(layout.w);
    drawLabel(ctx, "00:00", layout.left, bottom + 18, { size, color: colors.ink, alpha: 0.8 });
    drawLabel(ctx, "24:00", layout.right, bottom + 18, { size, color: colors.ink, alpha: 0.8, align: "right" });
};
