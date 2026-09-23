import type { SpinColors } from "@/app/lib/spin-drive";
import type { FigureSpec } from "./types";
import { prefersStillFigure } from "./lib/motion";
import { createSunDisk } from "./sun/disk-geometry";
import { sunClockAt } from "./sun/sun-clock";
import { drawSunOverlay } from "./sun/sun-overlay";
import { createSunSampler, type SunSurface } from "./sun/surface";

const CELL = 8;

const createSun = () => {
    const still = prefersStillFigure();
    const sampler = createSunSampler();
    let surface: SunSurface | null = null;
    return {
        mask: (cx: number, cy: number) => (surface ? sampler.density(surface, cx, cy) : 0),
        brightness: (cx: number, cy: number) => (surface ? sampler.brightness(surface, cx, cy) : 1),
        beforeFrame: (w: number, h: number, t: number) => {
            const disk = surface && surface.disk.w === w && surface.disk.h === h ? surface.disk : createSunDisk(w, h, CELL);
            surface = { disk, ...sunClockAt(t, still) };
        },
        overlay: (ctx: CanvasRenderingContext2D, _w: number, _h: number, _t: number, colors: SpinColors) => {
            if (surface) drawSunOverlay(ctx, surface.disk, surface.days, colors, surface.meridianWeight);
        },
    };
};

export const sunFigure: FigureSpec = { cell: CELL, createInstance: createSun };
