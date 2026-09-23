import type { SpinColors } from "@/app/lib/spin-drive";
import type { FigureSpec } from "./types";
import { ameliaBrightness, ameliaDensity, type AmeliaField } from "./amelia/field";
import { ameliaLayout, xToTime } from "./amelia/geometry";
import { drawAmeliaOverlay } from "./amelia/overlay";
import { playbackAt } from "./amelia/playback";
import { buildLaneCoverage } from "./amelia/timeline";
import { prefersStillFigure } from "./lib/motion";

const CELL = 8;

const createAmelia = () => {
    const still = prefersStillFigure();
    let field: AmeliaField | null = null;
    let playheadAlpha = 1;

    const resize = (w: number, h: number) => {
        const layout = ameliaLayout(w, h);
        const coverage = buildLaneCoverage(Math.ceil(w / CELL), (column) => xToTime(layout, column * CELL));
        return { layout, coverage, cell: CELL, playheadX: layout.left, memory: 1 };
    };

    return {
        mask: (cx: number, cy: number) => (field ? ameliaDensity(field, cx, cy) : 0),
        brightness: (cx: number, cy: number) => (field ? ameliaBrightness(field, cx, cy) : 1),
        beforeFrame: (w: number, h: number, t: number) => {
            if (!field || field.layout.w !== w || field.layout.h !== h) field = resize(w, h);
            const playback = playbackAt(t, still);
            field.playheadX = field.layout.left + playback.phase * (field.layout.right - field.layout.left);
            field.memory = playback.memory;
            playheadAlpha = playback.playheadAlpha;
        },
        overlay: (ctx: CanvasRenderingContext2D, _w: number, _h: number, _t: number, colors: SpinColors) => {
            if (field) drawAmeliaOverlay(ctx, field, colors, playheadAlpha);
        },
    };
};

export const ameliaFigure: FigureSpec = { cell: CELL, createInstance: createAmelia };
