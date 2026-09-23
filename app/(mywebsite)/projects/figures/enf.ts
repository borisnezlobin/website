import type { SpinColors } from "@/app/lib/spin-drive";
import type { FigureSpec } from "./types";
import { drawDayStrip } from "./enf/day-strip";
import { createEnfField, enfBrightness, enfDensity, sampleTrace, type EnfField } from "./enf/field";
import { enfLayout } from "./enf/geometry";
import { enfPlaybackAt } from "./enf/playback";
import { drawBaseline, drawReadout } from "./enf/readout";
import { drawHead, drawTrace, tintSurplus } from "./enf/trace";
import { prefersStillFigure } from "./lib/motion";

const CELL = 8;

const drawEnfOverlay = (ctx: CanvasRenderingContext2D, field: EnfField, head: number, colors: SpinColors) => {
    const { layout, envelope } = field;
    tintSurplus(ctx, layout, head, colors, envelope);
    drawBaseline(ctx, layout, head, colors);
    drawTrace(ctx, layout, head, colors, envelope);
    drawHead(ctx, layout, head, colors, envelope);
    drawReadout(ctx, layout, head, colors, envelope);
    drawDayStrip(ctx, layout, head, colors);
};

const createEnf = () => {
    const still = prefersStillFigure();
    let field: EnfField | null = null;
    let head = 0;
    return {
        mask: (cx: number, cy: number) => (field ? enfDensity(field, cx, cy) : 0),
        brightness: (cx: number, cy: number) => (field ? enfBrightness(field, cx, cy) : 1),
        beforeFrame: (w: number, h: number, t: number) => {
            if (!field || field.layout.w !== w || field.layout.h !== h) field = createEnfField(enfLayout(w, h), CELL);
            const playback = enfPlaybackAt(t, still);
            head = playback.head;
            field.envelope = playback.envelope;
            sampleTrace(field, head);
        },
        overlay: (ctx: CanvasRenderingContext2D, _w: number, _h: number, _t: number, colors: SpinColors) => {
            if (field) drawEnfOverlay(ctx, field, head, colors);
        },
    };
};

export const enfFigure: FigureSpec = { cell: CELL, createInstance: createEnf };
