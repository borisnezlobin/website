import type { SpinColors } from "@/app/lib/spin-drive";
import { drawLabel, FIGURE_MONO } from "../lib/canvas-text";
import { labelSize } from "../lib/frame-layout";
import { formatClock, formatHz, hourSampleAt } from "./series";
import { sampleIndexAtX, type EnfLayout } from "./geometry";

const LABEL_SPAN_PX = 80;

const traceSitsAbove = (layout: EnfLayout, head: number) => {
    let lean = 0;
    for (let x = layout.left; x < layout.left + LABEL_SPAN_PX; x += 4) lean += hourSampleAt(sampleIndexAtX(layout, head, x));
    return lean > 0;
};

export const drawBaseline = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors) => {
    const y = Math.round(layout.baseline) + 0.5;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(layout.left, y);
    ctx.lineTo(layout.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    const below = traceSitsAbove(layout, head);
    drawLabel(ctx, "50.000 Hz", layout.left, below ? y + 7 : y - 7, {
        size: labelSize(layout.w), color: colors.ink, alpha: 0.9, baseline: below ? "top" : "alphabetic",
    });
};

export const drawReadout = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors, alpha: number) => {
    const valueSize = layout.wide ? 24 : 17;
    const top = layout.wide ? 22 : 14;
    drawLabel(ctx, formatHz(Math.round(hourSampleAt(Math.floor(head)))), layout.left, top, {
        size: valueSize, color: colors.glow, alpha, family: FIGURE_MONO, baseline: "top", weight: 700,
    });
    drawLabel(ctx, formatClock(head), layout.left, top + valueSize + 6, {
        size: labelSize(layout.w) + 1, color: colors.ink, alpha: alpha * 0.9, baseline: "top",
    });
};
