import { runCreekEngine, type CreekScene, type Look } from "../creek-engine";
import type { FloatingLayerSource } from "../floating-layer";
import { advanceAsciiWater, buildAsciiWater, type AsciiWater } from "./ascii-water";
import { drawBubbleGlyphs } from "./bubble-glyphs";
import { CELL_WATER, NO_GLYPH } from "./char-grid";
import { inkDrifters } from "./drifter-cells";
import { createGlyphAtlas, stampGlyphRows, type GlyphAtlas } from "./glyph-atlas";
import { DAY_LEVELS, NIGHT_LEVELS, type TextMetrics } from "./glyph-rows";
import { samplePsiCorners, sampleWater } from "./water-sampler";
import { bayerThreshold, chooseWaterGlyph, HIDDEN, type GlyphChoice, type WaterSample } from "./water-glyphs";

/**
 * The whole creek as monospace ASCII: the lattice flow around the rocks is drawn as dashed
 * streamlines riding the current, with foam, bubbles and surface specks, and every character cell
 * picks its glyph from the water beneath it.
 */
export type AsciiFluidOptions = { fontFamily: string; floats?: FloatingLayerSource };

const SPECK_INK = { fadeIn: 0.8, fadeOut: 1.2, weight: 1 };

const fontSizeFor = (width: number) => (width < 600 ? 10 : 12);

function measureMetrics(ctx: CanvasRenderingContext2D, fontFamily: string, width: number): TextMetrics {
    const fontSize = fontSizeFor(width);
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    const cellW = ctx.measureText("M".repeat(100)).width / 100;
    return { fontFamily, fontSize, cellW, cellH: Math.round(fontSize * 1.18) };
}

function composeGlyphs(water: AsciiWater, time: number, dark: boolean) {
    const { chars, rows, bed } = water;
    samplePsiCorners(water);
    inkDrifters(water.specks.pool, chars, bed.grid.cellPx, SPECK_INK, water.speckInk);
    const sample: WaterSample = { vx: 0, vy: 0, spin: 0, foam: 0, line: 0, lineLevel: 0, speck: 0, shallow: 0, across: 0, y: 0, time, hash: 0, dark };
    const choice: GlyphChoice = { code: 32, bucket: HIDDEN };
    rows.clear();
    for (let k = 0; k < chars.kind.length; k++) {
        if (chars.kind[k] !== CELL_WATER) {
            if (chars.glyph[k] !== NO_GLYPH) rows.put(k, chars.glyph[k], chars.bucket[k]);
            continue;
        }
        sampleWater(water, k, sample);
        chooseWaterGlyph(sample, bayerThreshold(k % chars.cols, (k / chars.cols) | 0), choice);
        if (choice.bucket !== HIDDEN) rows.put(k, choice.code, choice.bucket);
    }
    drawBubbleGlyphs(rows, chars, bed.currents.bubbles, bed.grid.cellPx);
}

function asciiScene(fontFamily: string): CreekScene<AsciiWater> {
    let atlas: GlyphAtlas | null = null;
    let atlasVersion = -1;
    const atlasFor = (water: AsciiWater, look: Look) => {
        if (atlas && atlasVersion === look.version) return atlas;
        atlasVersion = look.version;
        atlas = createGlyphAtlas(water.metrics, look.dark ? NIGHT_LEVELS : DAY_LEVELS, look.palette, water.bed.size.dpr);
        return atlas;
    };
    return {
        build: (size, ctx) => buildAsciiWater(size, measureMetrics(ctx, fontFamily, size.width)),
        advance: (water, steps, delta) => { if (steps > 0) advanceAsciiWater(water, steps, delta); },
        paint: (ctx, water, look, time) => {
            composeGlyphs(water, time, look.dark);
            stampGlyphRows(ctx, water.rows, atlasFor(water, look), water.metrics);
        },
    };
}

export function createAsciiFluid(canvas: HTMLCanvasElement, options: AsciiFluidOptions) {
    return runCreekEngine(canvas, asciiScene(options.fontFamily), { floats: options.floats });
}
