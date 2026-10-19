import { dataTexture } from "./gl-layer";

/**
 * The runtime glyph atlas: a row of characters drawn with the page's own monospace font, measured
 * for how much ink each one puts down, and sorted from lightest to darkest. The shader then turns
 * any density into a character by indexing this ramp, so the ramp always matches the font that
 * actually loaded rather than a hand-ordered guess.
 */
export type GlyphRamp = { texture: WebGLTexture; count: number; tile: { w: number; h: number } };

const CANDIDATES = ".'`,:-~;=+^*!/|\\oc(%x#@";
const RAMP_SIZE = 12;

function inkOf(ctx: CanvasRenderingContext2D, glyph: string, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillText(glyph, w / 2, h / 2);
    const pixels = ctx.getImageData(0, 0, w, h).data;
    let ink = 0;
    for (let k = 3; k < pixels.length; k += 4) ink += pixels[k];
    return ink;
}

/** Keeps an evenly spread subset of the measured glyphs, so each step of the ramp adds about the same ink. */
function evenSteps(sorted: { glyph: string; ink: number }[], count: number) {
    const picked: string[] = [];
    const top = sorted[sorted.length - 1].ink;
    for (let n = 0; n < count; n++) {
        const target = (top * (n + 1)) / count;
        const best = sorted.reduce((a, b) => (Math.abs(b.ink - target) < Math.abs(a.ink - target) ? b : a));
        if (!picked.includes(best.glyph)) picked.push(best.glyph);
    }
    return picked;
}

function measureRamp(fontFamily: string, fontSize: number, w: number, h: number) {
    const probe = document.createElement("canvas");
    probe.width = w; probe.height = h;
    const ctx = probe.getContext("2d", { willReadFrequently: true })!;
    ctx.font = `500 ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const measured = [...CANDIDATES].map((glyph) => ({ glyph, ink: inkOf(ctx, glyph, w, h) })).sort((a, b) => a.ink - b.ink);
    return evenSteps(measured, RAMP_SIZE);
}

/** Draws " " plus the ramp into one strip, white on transparent, at device resolution. */
export function createGlyphRamp(gl: WebGL2RenderingContext, fontFamily: string, cell: { w: number; h: number; fontSize: number }, dpr: number): GlyphRamp {
    const w = Math.ceil(cell.w * dpr), h = Math.ceil(cell.h * dpr);
    const glyphs = [" ", ...measureRamp(fontFamily, cell.fontSize * dpr, w, h)];
    const strip = document.createElement("canvas");
    strip.width = w * glyphs.length; strip.height = h;
    const ctx = strip.getContext("2d")!;
    ctx.font = `500 ${cell.fontSize * dpr}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    glyphs.forEach((glyph, n) => ctx.fillText(glyph, n * w + w / 2, h / 2));
    const texture = dataTexture(gl, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, strip);
    return { texture, count: glyphs.length, tile: { w, h } };
}
