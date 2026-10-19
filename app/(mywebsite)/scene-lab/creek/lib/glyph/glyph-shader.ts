import { createAsciiFluid } from "../ascii/ascii-fluid";
import { buildCharGrid, NO_GLYPH, type CharGrid } from "../ascii/char-grid";
import { createGlyphAtlas, stampGlyphRows, type GlyphAtlas } from "../ascii/glyph-atlas";
import { createGlyphRows, DAY_LEVELS, NIGHT_LEVELS, type GlyphRows, type TextMetrics } from "../ascii/glyph-rows";
import { buildCreekBed, type CreekBed } from "../creek-bed";
import { runCreekEngine, type CreekScene, type Look } from "../creek-engine";
import type { FloatingLayerSource } from "../floating-layer";
import type { CanvasSize } from "../stage";
import { createAsciiPass, type AsciiPass } from "./ascii-pass";
import { createDyePass, type DyePass } from "./dye-pass";
import { createGlLayer, type GlLayer } from "./gl-layer";
import { createGlyphRamp, type GlyphRamp } from "./glyph-ramp";

/**
 * The creek through an ASCII shader: the shared lattice flow drives dye that the GPU carries at
 * high resolution, and a post-process shader prints it as characters picked from a glyph ramp
 * measured at runtime from the loaded font. The banks, rocks and paper stay on the 2D canvas
 * underneath; the glyphs are drawn on a WebGL layer over it. Without WebGL2 it falls back to the
 * CPU ASCII creek.
 */
export type GlyphShaderOptions = { fontFamily: string; floats?: FloatingLayerSource };

type GlyphWorld = { bed: CreekBed; chars: CharGrid; banks: GlyphRows; metrics: TextMetrics; dye: DyePass; ramp: GlyphRamp };

const fontSizeFor = (width: number) => (width < 600 ? 10 : 12);

function measureMetrics(ctx: CanvasRenderingContext2D, fontFamily: string, width: number): TextMetrics {
    const fontSize = fontSizeFor(width);
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    const cellW = ctx.measureText("M".repeat(100)).width / 100;
    return { fontFamily, fontSize, cellW, cellH: Math.round(fontSize * 1.18) };
}

function bankRows(chars: CharGrid) {
    const rows = createGlyphRows(chars.cols, chars.rows);
    for (let k = 0; k < chars.kind.length; k++) if (chars.glyph[k] !== NO_GLYPH) rows.put(k, chars.glyph[k], chars.bucket[k]);
    return rows;
}

function glyphScene(layer: GlLayer, fontFamily: string): CreekScene<GlyphWorld> & { dispose: () => void } {
    const ascii: AsciiPass = createAsciiPass(layer);
    let world: GlyphWorld | null = null;
    let banksAtlas: GlyphAtlas | null = null;
    let version = -1;
    const releaseWorld = () => { if (!world) return; world.dye.dispose(); layer.gl.deleteTexture(world.ramp.texture); };

    const build = (size: CanvasSize, ctx: CanvasRenderingContext2D): GlyphWorld => {
        releaseWorld();
        layer.resize(size);
        const metrics = measureMetrics(ctx, fontFamily, size.width);
        const bed = buildCreekBed(size, metrics.cellW * 1.7);
        const chars = buildCharGrid(size.width, size.height, metrics.cellW, metrics.cellH, bed.rocks);
        world = {
            bed, chars, metrics, banks: bankRows(chars),
            dye: createDyePass(layer, bed.grid, size),
            ramp: createGlyphRamp(layer.gl, fontFamily, { w: metrics.cellW, h: metrics.cellH, fontSize: metrics.fontSize }, size.dpr),
        };
        return world;
    };

    const banksFor = (target: GlyphWorld, look: Look) => {
        if (banksAtlas && version === look.version) return banksAtlas;
        version = look.version;
        banksAtlas = createGlyphAtlas(target.metrics, look.dark ? NIGHT_LEVELS : DAY_LEVELS, look.palette, target.bed.size.dpr);
        return banksAtlas;
    };

    return {
        build,
        advance: (target, steps, delta, time) => {
            if (steps === 0) return;
            target.dye.upload(target.bed.grid, target.bed.currents.foam.values);
            target.dye.advance(steps, time, delta);
        },
        paint: (ctx, target, look) => {
            stampGlyphRows(ctx, target.banks, banksFor(target, look), target.metrics);
            ascii.render(target.dye, target.ramp, look, { w: target.metrics.cellW, h: target.metrics.cellH }, target.bed.grid.flow.inflowSpeed);
        },
        dispose: () => { releaseWorld(); ascii.dispose(); },
    };
}

export function createGlyphShader(canvas: HTMLCanvasElement, options: GlyphShaderOptions) {
    const layer = createGlLayer(canvas);
    if (!layer) return createAsciiFluid(canvas, options);
    const scene = glyphScene(layer, options.fontFamily);
    const engine = runCreekEngine(canvas, scene, { floats: options.floats, warmUpSteps: 1800 });
    return {
        dispose: () => {
            engine.dispose();
            scene.dispose();
            layer.dispose();
        },
    };
}
