import { buildCharGrid, NO_GLYPH, type CharGrid } from "../ascii/char-grid";
import { createGlyphAtlas, stampGlyphRows, type GlyphAtlas } from "../ascii/glyph-atlas";
import { createGlyphRows, DAY_LEVELS, NIGHT_LEVELS, type GlyphRows, type TextMetrics } from "../ascii/glyph-rows";
import { buildCreekBed, STEPS_PER_SECOND, type CreekBed } from "../creek-bed";
import { runCreekEngine, type CreekScene, type Look } from "../creek-engine";
import type { FloatingLayerSource } from "../floating-layer";
import type { CanvasSize } from "../stage";
import { DAY_CODE_LEVELS, NIGHT_CODE_LEVELS, stampRiver } from "./river-render";
import { createTextRiver, type TextRiver } from "./text-lines";

/**
 * The creek as a river of code: lines of source text pour in at the top and are carried by the
 * lattice flow, bending round the faceted rocks, stretching through the rapid and tumbling in the
 * eddies before they re-form. The banks keep the ASCII survey-map shoreline.
 */
export type TextRiverOptions = { fontFamily: string; floats?: FloatingLayerSource };

type RiverWorld = { bed: CreekBed; river: TextRiver; chars: CharGrid; banks: GlyphRows; metrics: TextMetrics };

const fontSizeFor = (width: number) => (width < 600 ? 11 : 13);

function measureMetrics(ctx: CanvasRenderingContext2D, fontFamily: string, width: number): TextMetrics {
    const fontSize = fontSizeFor(width);
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    const cellW = ctx.measureText("M".repeat(100)).width / 100;
    return { fontFamily, fontSize, cellW, cellH: Math.round(fontSize * 1.25) };
}

/** The banks' survey-map glyphs never change, so they are laid into glyph rows once. */
function bankRows(chars: CharGrid) {
    const rows = createGlyphRows(chars.cols, chars.rows);
    for (let k = 0; k < chars.kind.length; k++) if (chars.glyph[k] !== NO_GLYPH) rows.put(k, chars.glyph[k], chars.bucket[k]);
    return rows;
}

function buildWorld(size: CanvasSize, metrics: TextMetrics): RiverWorld {
    const bed = buildCreekBed(size, metrics.cellW * 1.6);
    const chars = buildCharGrid(size.width, size.height, metrics.cellW, metrics.cellH, bed.rocks);
    const river = createTextRiver(bed.grid, { width: size.width, height: size.height, charW: metrics.cellW, lineH: metrics.cellH }, STEPS_PER_SECOND);
    return { bed, river, chars, banks: bankRows(chars), metrics };
}

type Atlases = { banks: GlyphAtlas; code: GlyphAtlas };

function riverScene(fontFamily: string): CreekScene<RiverWorld> {
    let atlases: Atlases | null = null;
    let version = -1;
    const atlasesFor = (world: RiverWorld, look: Look): Atlases => {
        if (atlases && version === look.version) return atlases;
        version = look.version;
        const dpr = world.bed.size.dpr;
        atlases = {
            banks: createGlyphAtlas(world.metrics, look.dark ? NIGHT_LEVELS : DAY_LEVELS, look.palette, dpr),
            code: createGlyphAtlas(world.metrics, look.dark ? NIGHT_CODE_LEVELS : DAY_CODE_LEVELS, look.palette, dpr),
        };
        return atlases;
    };
    return {
        build: (size, ctx) => buildWorld(size, measureMetrics(ctx, fontFamily, size.width)),
        advance: (world, steps, delta) => world.river.step(steps, delta),
        paint: (ctx, world, look) => {
            const sheets = atlasesFor(world, look);
            stampGlyphRows(ctx, world.banks, sheets.banks, world.metrics);
            stampRiver(ctx, world.river, sheets.code, world.bed.size.height);
        },
    };
}

export function createTextRiverScene(canvas: HTMLCanvasElement, options: TextRiverOptions) {
    return runCreekEngine(canvas, riverScene(options.fontFamily), { floats: options.floats, warmUpSteps: 1800 });
}
