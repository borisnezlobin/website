import type { CreekPalette } from "../palette";
import type { GlyphRows, InkLevel, TextMetrics } from "./glyph-rows";
import { BUCKET_COUNT } from "./water-glyphs";

/**
 * Every glyph the creek uses, pre-drawn once per ink level into an offscreen sheet. A frame then
 * stamps glyphs with `drawImage` instead of `fillText`, which skips text shaping entirely: drawing
 * the frame's few thousand characters costs a fraction of shaping a few hundred rows of text.
 * The sheet is rebuilt when the theme (palette) or the canvas size changes.
 */
export type GlyphAtlas = {
    canvas: HTMLCanvasElement;
    /** Column of each character code in the sheet, or -1 if it isn't in the sheet. */
    column: Int16Array;
    tileW: number;
    tileH: number;
    dpr: number;
};

/** Printable ASCII plus the few Latin-1 marks the water uses. */
const SHEET_GLYPHS = String.fromCharCode(...Array.from({ length: 94 }, (_, n) => 33 + n)) + "¯°·";
const PAD = 2;

export function createGlyphAtlas(metrics: TextMetrics, levels: InkLevel[], palette: CreekPalette, dpr: number): GlyphAtlas {
    const tileW = Math.ceil((metrics.cellW + PAD * 2) * dpr), tileH = Math.ceil((metrics.cellH + PAD * 2) * dpr);
    const canvas = document.createElement("canvas");
    canvas.width = tileW * SHEET_GLYPHS.length;
    canvas.height = tileH * BUCKET_COUNT;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "middle";
    const column = new Int16Array(65536).fill(-1);
    for (let b = 0; b < BUCKET_COUNT; b++) {
        const level = levels[b];
        ctx.font = `${level.weight} ${metrics.fontSize}px ${metrics.fontFamily}`;
        ctx.fillStyle = level.red ? palette.red : palette.ink;
        ctx.globalAlpha = level.alpha;
        for (let g = 0; g < SHEET_GLYPHS.length; g++) {
            column[SHEET_GLYPHS.charCodeAt(g)] = g;
            ctx.fillText(SHEET_GLYPHS[g], (g * tileW) / dpr + PAD, (b * tileH) / dpr + PAD + metrics.cellH / 2);
        }
    }
    return { canvas, column, tileW, tileH, dpr };
}

/** Stamps the frame's glyphs from the sheet, each snapped to whole device pixels so it stays crisp. */
export function stampGlyphRows(ctx: CanvasRenderingContext2D, rows: GlyphRows, atlas: GlyphAtlas, metrics: TextMetrics) {
    const { canvas, column, tileW, tileH, dpr } = atlas;
    const w = tileW / dpr, h = tileH / dpr;
    for (let b = 0; b < BUCKET_COUNT; b++) {
        const codes = rows.codes[b], used = rows.used[b], sy = b * tileH;
        for (let j = 0; j < rows.rows; j++) {
            if (!used[j]) continue;
            const y = Math.round((j * metrics.cellH - PAD) * dpr) / dpr;
            for (let i = 0, k = j * rows.cols; i < rows.cols; i++, k++) {
                const g = column[codes[k]];
                if (g < 0) continue;
                ctx.drawImage(canvas, g * tileW, sy, tileW, tileH, Math.round((i * metrics.cellW - PAD) * dpr) / dpr, y, w, h);
            }
        }
    }
}
