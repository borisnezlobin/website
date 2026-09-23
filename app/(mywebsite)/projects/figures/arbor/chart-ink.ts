import type { SpinColors } from "@/app/lib/spin-drive";
import { FIGURE_MONO, drawLabel } from "../lib/canvas-text";
import { labelSize } from "../lib/frame-layout";
import { columnCentre, columnHeight, type ChartLayout } from "./chart-layout";
import { RUNNER_UP, WINNER } from "./demo-round";
import type { RoundScene } from "./round-scene";

const MONO_PX = 11;

const drawEnvelope = (ctx: CanvasRenderingContext2D, layout: ChartLayout, x: number, alpha: number, colors: SpinColors) => {
    if (alpha <= 0.01) return;
    const half = Math.round(layout.columnHalf), top = layout.baseline - layout.stubHeight;
    const left = Math.round(x) - half + 0.5, right = Math.round(x) + half - 0.5;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(left, top + 0.5, right - left, layout.stubHeight - 1);
    ctx.moveTo(left, top + 0.5);
    ctx.lineTo(x, top + layout.stubHeight * 0.55);
    ctx.lineTo(right, top + 0.5);
    ctx.stroke();
};

const drawCap = (ctx: CanvasRenderingContext2D, layout: ChartLayout, x: number, top: number, color: string, thickness: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - layout.columnHalf), Math.round(top) - thickness + 1, Math.round(layout.columnHalf * 2), thickness);
};

const drawBidLabels = (ctx: CanvasRenderingContext2D, layout: ChartLayout, index: number, alpha: number, color: string) => {
    const seat = layout.seats[index], x = columnCentre(layout, index);
    const style = { size: MONO_PX, family: FIGURE_MONO, color, alpha, align: "center" as const };
    const scoreY = layout.baseline + (layout.wide ? 36 : 20);
    if (layout.wide) drawLabel(ctx, seat.agent ?? "", x, layout.baseline + 20, style);
    drawLabel(ctx, seat.score.toFixed(2), x, scoreY, style);
};

const drawBid = (ctx: CanvasRenderingContext2D, scene: RoundScene, index: number, colors: SpinColors) => {
    const layout = scene.layout as ChartLayout;
    const seat = layout.seats[index], state = scene.states[index];
    const x = columnCentre(layout, index), top = scene.tops[index];
    const won = seat === WINNER ? scene.moment.reveal : 0;
    ctx.globalAlpha = state.opened * (0.7 + 0.3 * won);
    drawCap(ctx, layout, x, top, colors.ink, 1);
    ctx.globalAlpha = won;
    drawCap(ctx, layout, x, top, colors.red, 3);
    drawBidLabels(ctx, layout, index, 0.85 * state.opened, won > 0.5 ? colors.glow : colors.ink);
};

const drawPriceLabel = (ctx: CanvasRenderingContext2D, layout: ChartLayout, x: number, y: number, alpha: number, colors: SpinColors) => {
    const style = { size: labelSize(layout.w), color: colors.glow, alpha, align: "right" as const };
    if (layout.wide) { drawLabel(ctx, "Runner-up's price", x, y - 8, style); return; }
    drawLabel(ctx, "Runner-up's", x, y + 16, style);
    drawLabel(ctx, "price", x, y + 30, style);
};

const drawRunnerUpPrice = (ctx: CanvasRenderingContext2D, layout: ChartLayout, reveal: number, colors: SpinColors) => {
    if (reveal <= 0.01) return;
    const y = Math.round(layout.baseline - columnHeight(layout, RUNNER_UP.score, 1)) + 0.5;
    const start = layout.left, end = layout.left + layout.pitch * layout.seats.length;
    ctx.globalAlpha = 0.75 * reveal;
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.lineTo(start + (end - start) * reveal, y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawPriceLabel(ctx, layout, end, y, reveal, colors);
};

export const drawChartInk = (ctx: CanvasRenderingContext2D, scene: RoundScene, colors: SpinColors) => {
    const layout = scene.layout;
    if (!layout) return;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = colors.ink;
    ctx.fillRect(layout.left - layout.pitch * 0.2, layout.baseline, layout.pitch * (layout.seats.length + 0.4), 1);
    layout.seats.forEach((seat, index) => {
        const sealed = 1 - scene.states[index].opened;
        const envelopeAlpha = seat.agent === null ? 0.18 + 0.4 * sealed : 0.58 * sealed;
        drawEnvelope(ctx, layout, columnCentre(layout, index), envelopeAlpha, colors);
        if (seat.agent !== null) drawBid(ctx, scene, index, colors);
    });
    drawRunnerUpPrice(ctx, layout, scene.moment.reveal, colors);
    ctx.globalAlpha = 1;
};
