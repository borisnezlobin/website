import { isWideFigure } from "../lib/frame-layout";
import { FIELD_INCHES } from "./autonomous-path";

export type HeronLayout = {
    w: number;
    h: number;
    wide: boolean;
    left: number;
    top: number;
    size: number;
    scale: number;
    listX: number;
    listTop: number;
    rowHeight: number;
    seamClearance: number;
    quietZone: { x: number; y: number; w: number; h: number };
};

export const LIST_FONT_PX = 13;
const ROW_HEIGHT = 25;
const LIST_GAP = 72;
const LIST_WIDTH = 104;
const WIDE_FIELD_SHARE = 0.78;

export const heronLayout = (w: number, h: number, steps: number): HeronLayout => {
    const wide = isWideFigure(w);
    const size = Math.round(Math.min(h * (wide ? WIDE_FIELD_SHARE : 0.9), w * 0.86));
    const left = Math.round(wide ? w * 0.64 - size / 2 : (w - size) / 2);
    const top = Math.round(wide ? h * 0.04 : (h - size) / 2);
    const listTop = top + size / 2 - ((steps - 1) * ROW_HEIGHT) / 2;
    return {
        w, h, wide, left, top, size,
        scale: size / FIELD_INCHES,
        listX: left - LIST_GAP - LIST_WIDTH,
        listTop,
        rowHeight: ROW_HEIGHT,
        seamClearance: 3,
        quietZone: { x: left - LIST_GAP - LIST_WIDTH - 36, y: listTop - 28, w: LIST_WIDTH + 64, h: (steps - 1) * ROW_HEIGHT + 56 },
    };
};

export const fieldToCanvasX = (layout: HeronLayout, x: number) => layout.left + x * layout.scale;
export const fieldToCanvasY = (layout: HeronLayout, y: number) => layout.top + (FIELD_INCHES - y) * layout.scale;
export const canvasToFieldX = (layout: HeronLayout, x: number) => (x - layout.left) / layout.scale;
export const canvasToFieldY = (layout: HeronLayout, y: number) => FIELD_INCHES - (y - layout.top) / layout.scale;

export const insideField = (layout: HeronLayout, x: number, y: number) =>
    x >= layout.left && x <= layout.left + layout.size && y >= layout.top && y <= layout.top + layout.size;
