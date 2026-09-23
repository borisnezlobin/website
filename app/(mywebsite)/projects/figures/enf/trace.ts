import type { SpinColors } from "@/app/lib/spin-drive";
import { HOUR_MHZ, hourSampleAt, WINDOW_SAMPLES } from "./series";
import { mhzToY, sampleX, type EnfLayout } from "./geometry";

const TRACE_SEGMENTS = 6;

const traceWindow = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, from: number, to: number) => {
    ctx.moveTo(sampleX(layout, head, from), mhzToY(layout, hourSampleAt(from)));
    for (let index = Math.floor(from) + 1; index < to; index++) {
        ctx.lineTo(sampleX(layout, head, index), mhzToY(layout, HOUR_MHZ[index]));
    }
    ctx.lineTo(sampleX(layout, head, to), mhzToY(layout, hourSampleAt(to)));
};

export const tintSurplus = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors, alpha: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(layout.left, 0, layout.right - layout.left, layout.baseline);
    ctx.clip();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.4 * alpha;
    ctx.fillStyle = colors.red;
    ctx.beginPath();
    ctx.moveTo(layout.left, layout.baseline);
    traceWindow(ctx, layout, head, head - WINDOW_SAMPLES, head);
    ctx.lineTo(layout.right, layout.baseline);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

export const drawTrace = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors, alpha: number) => {
    const segment = WINDOW_SAMPLES / TRACE_SEGMENTS;
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1.25;
    ctx.lineJoin = "round";
    for (let k = 0; k < TRACE_SEGMENTS; k++) {
        const from = head - WINDOW_SAMPLES + k * segment;
        ctx.globalAlpha = alpha * (0.3 + (0.7 * (k + 1)) / TRACE_SEGMENTS);
        ctx.beginPath();
        traceWindow(ctx, layout, head, from, from + segment);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
};

export const drawHead = (ctx: CanvasRenderingContext2D, layout: EnfLayout, head: number, colors: SpinColors, alpha: number) => {
    const y = mhzToY(layout, hourSampleAt(head));
    ctx.fillStyle = colors.red;
    ctx.globalAlpha = alpha * 0.18;
    ctx.beginPath();
    ctx.arc(layout.right, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(layout.right, y, 2.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
};
