import type { Mask } from "@/app/lib/spin-drive";

export type SheetFill = {
    shown: number;
    pulse: number;
};

const MARGIN = 0.09;
const HEADER_BOTTOM = 0.1;
const LINE_PITCH = 0.03;
const LINE_THICKNESS = 0.4;
const LINES_PER_PARAGRAPH = 6;
const FRONTIER_WIDTH = 0.018;
const UNWRITTEN_DENSITY = 0.015;

const rowHash = (row: number) => {
    const x = Math.sin(row * 91.7 + 13.1) * 43758.5453;
    return x - Math.floor(x);
};

const headerBand = (x: number, y: number, w: number, h: number) => {
    const middle = h * HEADER_BOTTOM * 0.5;
    const fade = 1 - Math.abs(y - middle) / middle;
    const wobble = Math.sin(x * 0.03) * 0.15;
    return Math.max(0, Math.min(1, fade * 1.4 + wobble));
};

const typeLine = (x: number, y: number, w: number, h: number) => {
    const offset = y - h * (HEADER_BOTTOM + LINE_PITCH);
    if (offset < 0) return 0;
    const pitch = h * LINE_PITCH;
    const row = Math.floor(offset / pitch);
    if (row % LINES_PER_PARAGRAPH === LINES_PER_PARAGRAPH - 1) return 0;
    if (offset - row * pitch > pitch * LINE_THICKNESS) return 0;
    const lineEnd = w * (MARGIN + (1 - MARGIN * 2) * (0.45 + 0.55 * rowHash(row)));
    return x > w * MARGIN && x < lineEnd ? 0.9 : 0;
};

const writtenDensity = (x: number, y: number, w: number, h: number) =>
    y < h * HEADER_BOTTOM ? headerBand(x, y, w, h) : typeLine(x, y, w, h);

export function sheetMask(fill: SheetFill): Mask {
    return (x, y, w, h) => {
        const frontier = fill.shown * h;
        const distance = (y - frontier) / (h * FRONTIER_WIDTH);
        if (Math.abs(distance) < 1) return 0.55 + 0.45 * fill.pulse * (1 - Math.abs(distance));
        if (distance > 0) return UNWRITTEN_DENSITY;
        return writtenDensity(x, y, w, h);
    };
}
