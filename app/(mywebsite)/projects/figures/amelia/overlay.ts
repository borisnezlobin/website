import type { SpinColors } from "@/app/lib/spin-drive";
import { drawLabel, FIGURE_SERIF } from "../lib/canvas-text";
import { labelSize } from "../lib/frame-layout";
import { coverageAt, type AmeliaField } from "./field";
import { laneCentre, timeToX, type AmeliaLayout } from "./geometry";
import { DECISECONDS_PER_MINUTE, DURATION_DS, LANE_COUNT, TURNS } from "./timeline";

const TICK_MINUTES = [0, 10, 20, 30, 40];

const traceTurns = (ctx: CanvasRenderingContext2D, layout: AmeliaLayout, heard: boolean, playheadX: number) => {
    const thickness = layout.wide ? 3 : 2;
    ctx.beginPath();
    for (const [start, end, lane] of TURNS) {
        const x0 = timeToX(layout, start);
        if (x0 < playheadX !== heard) continue;
        const width = Math.max(1, timeToX(layout, end) - x0);
        ctx.rect(x0, laneCentre(layout, lane) - thickness / 2, width, thickness);
    }
};

const drawTurnMarks = (ctx: CanvasRenderingContext2D, field: AmeliaField, colors: SpinColors) => {
    ctx.fillStyle = colors.glow;
    traceTurns(ctx, field.layout, true, field.playheadX);
    ctx.globalAlpha = 0.28 + 0.52 * field.memory;
    ctx.fill();
    traceTurns(ctx, field.layout, false, field.playheadX);
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1;
};

const drawSpeakingMarks = (ctx: CanvasRenderingContext2D, field: AmeliaField, colors: SpinColors, alpha: number) => {
    ctx.fillStyle = colors.red;
    for (let lane = 0; lane < LANE_COUNT; lane++) {
        const talk = coverageAt(field, lane, field.playheadX);
        if (talk < 0.02) continue;
        ctx.globalAlpha = alpha * Math.min(1, 0.35 + talk);
        ctx.beginPath();
        ctx.arc(field.playheadX, laneCentre(field.layout, lane), 1.5 + 2.5 * Math.sqrt(talk), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
};

const drawPlayhead = (ctx: CanvasRenderingContext2D, field: AmeliaField, colors: SpinColors, alpha: number) => {
    const { top, bottom } = field.layout;
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(field.playheadX, top - 6);
    ctx.lineTo(field.playheadX, bottom + 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawSpeakingMarks(ctx, field, colors, alpha);
};

const drawMinuteTicks = (ctx: CanvasRenderingContext2D, layout: AmeliaLayout, colors: SpinColors) => {
    const y = layout.bottom + 12;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (const minute of TICK_MINUTES) {
        const x = Math.round(timeToX(layout, Math.min(DURATION_DS, minute * DECISECONDS_PER_MINUTE))) + 0.5;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 5);
    }
    ctx.stroke();
    TICK_MINUTES.forEach((minute, index) => {
        const label = index === TICK_MINUTES.length - 1 ? `${minute} min` : `${minute}`;
        const x = timeToX(layout, minute * DECISECONDS_PER_MINUTE);
        drawLabel(ctx, label, x, y + 20, { size: labelSize(layout.w), color: colors.ink, alpha: 0.85, align: index === TICK_MINUTES.length - 1 ? "left" : "center", family: FIGURE_SERIF });
    });
};

export const drawAmeliaOverlay = (ctx: CanvasRenderingContext2D, field: AmeliaField, colors: SpinColors, playheadAlpha: number) => {
    drawTurnMarks(ctx, field, colors);
    if (field.layout.wide) drawMinuteTicks(ctx, field.layout, colors);
    drawPlayhead(ctx, field, colors, playheadAlpha);
};
