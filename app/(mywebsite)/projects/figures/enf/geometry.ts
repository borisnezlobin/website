import { figureInsetX, isWideFigure } from "../lib/frame-layout";
import { SCALE_MHZ, WINDOW_SAMPLES } from "./series";

export type EnfLayout = {
    w: number;
    h: number;
    wide: boolean;
    left: number;
    right: number;
    top: number;
    baseline: number;
    amplitude: number;
    strip: { top: number; bottom: number } | null;
};

export const enfLayout = (w: number, h: number): EnfLayout => {
    const wide = isWideFigure(w);
    const left = figureInsetX(w);
    const top = wide ? 78 : Math.max(46, h * 0.18);
    const strip = wide ? { top: h - 58, bottom: h - 24 } : null;
    const bottom = strip ? strip.top - 26 : h - Math.max(12, h * 0.05);
    return { w, h, wide, left, right: w - left, top, baseline: (top + bottom) / 2, amplitude: (bottom - top) / 2, strip };
};

export const mhzToY = (layout: EnfLayout, mhz: number) => layout.baseline - (mhz / SCALE_MHZ) * layout.amplitude;

export const sampleIndexAtX = (layout: EnfLayout, head: number, x: number) =>
    head - (WINDOW_SAMPLES * (layout.right - x)) / (layout.right - layout.left);

export const sampleX = (layout: EnfLayout, head: number, index: number) =>
    layout.right - ((head - index) / WINDOW_SAMPLES) * (layout.right - layout.left);
