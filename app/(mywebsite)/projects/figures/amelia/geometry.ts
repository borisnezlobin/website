import { figureInsetX, isWideFigure } from "../lib/frame-layout";
import { DURATION_DS, LANE_COUNT } from "./timeline";

export type AmeliaLayout = {
    w: number;
    h: number;
    wide: boolean;
    left: number;
    right: number;
    top: number;
    bottom: number;
    pitch: number;
    halfBand: number;
};

export const ameliaLayout = (w: number, h: number): AmeliaLayout => {
    const wide = isWideFigure(w);
    const left = figureInsetX(w);
    const top = Math.max(14, h * 0.07);
    const bottom = wide ? h - 46 : h - Math.max(14, h * 0.07);
    const pitch = (bottom - top) / LANE_COUNT;
    return { w, h, wide, left, right: w - left, top, bottom, pitch, halfBand: pitch * 0.29 };
};

export const timeToX = (layout: AmeliaLayout, ds: number) =>
    layout.left + (ds / DURATION_DS) * (layout.right - layout.left);

export const xToTime = (layout: AmeliaLayout, x: number) =>
    ((x - layout.left) / (layout.right - layout.left)) * DURATION_DS;

export const laneCentre = (layout: AmeliaLayout, lane: number) => layout.top + (lane + 0.5) * layout.pitch;

export const laneAt = (layout: AmeliaLayout, y: number) => Math.floor((y - layout.top) / layout.pitch);
