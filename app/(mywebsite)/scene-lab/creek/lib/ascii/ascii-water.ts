import { banksAt } from "../creek-layout";
import { buildCreekBed, type CreekBed } from "../creek-bed";
import { createSpecks, type Specks } from "../specks";
import { createStreamlines, type Streamlines } from "../streamlines";
import type { CanvasSize } from "../stage";
import { buildCharGrid, type CharGrid } from "./char-grid";
import { createGlyphRows, type GlyphRows, type TextMetrics } from "./glyph-rows";
import type { StreamlineStyle } from "./streamline-glyphs";

/**
 * Everything the ASCII creek adds to the shared bed for one canvas size: the streamline and
 * travel-time fields, the surface specks, and the character grid laid over the water.
 */
export type AsciiWater = {
    bed: CreekBed;
    streamlines: Streamlines;
    /** ψ sampled at every character-cell corner, refreshed each frame. */
    psiCorners: Float32Array;
    lineStyle: StreamlineStyle;
    specks: Specks;
    speckInk: Float32Array;
    chars: CharGrid;
    rows: GlyphRows;
    metrics: TextMetrics;
};

const STREAMLINE_SPACING_PX = 40;

/** As many streamlines as fit across the creek at its widest, about one every few characters. */
function streamlineStyle(width: number, height: number): StreamlineStyle {
    const widths = [0.1, 0.3, 0.5, 0.7, 0.9].map((y) => { const b = banksAt(y, width, height); return b.right - b.left; });
    return { levels: Math.max(6, Math.round(Math.max(...widths) / STREAMLINE_SPACING_PX)), dashesPerSecond: 0.55, duty: 0.72 };
}

export function buildAsciiWater(size: CanvasSize, metrics: TextMetrics): AsciiWater {
    const { width, height } = size;
    const bed = buildCreekBed(size, metrics.cellW * 1.7);
    const chars = buildCharGrid(width, height, metrics.cellW, metrics.cellH, bed.rocks);
    const specks = createSpecks(bed.grid, metrics.cellW * metrics.cellH);
    specks.scatter();
    return {
        bed, chars, specks, metrics,
        streamlines: createStreamlines(bed.grid),
        psiCorners: new Float32Array((chars.cols + 1) * (chars.rows + 1)),
        lineStyle: streamlineStyle(width, height),
        speckInk: new Float32Array(chars.cols * chars.rows),
        rows: createGlyphRows(chars.cols, chars.rows),
    };
}

export function advanceAsciiWater(water: AsciiWater, steps: number, delta: number) {
    water.streamlines.update(steps, delta);
    water.specks.update(steps, delta);
}
