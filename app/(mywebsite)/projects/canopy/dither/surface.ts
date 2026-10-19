import { makeCanvas } from "../paper";
import type { SceneSize } from "../scene-loop";

/** CSS pixels per dither cell. */
export const CELL = 2;

export type Rgb = [number, number, number];

/** Raw RGBA of the density buffer, one pixel per cell. */
export type DensityPixels = { data: Uint8ClampedArray; columns: number; rows: number };

/** Ink is the red channel of the density buffer, blossom the green one. */
export type DitherPalette = { ink: Rgb; blush: Rgb; bloom: Rgb };

/** The 8x8 Bayer matrix, built by recursively tiling the 2x2 pattern [0 2; 3 1]. */
function buildBayer(size: number): number[] {
    if (size === 1) return [0];
    const half = size / 2;
    const smaller = buildBayer(half);
    const offsets = [0, 2, 3, 1];
    const matrix = new Array<number>(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const quadrant = (y >= half ? 2 : 0) + (x >= half ? 1 : 0);
            matrix[y * size + x] = 4 * smaller[(y % half) * half + (x % half)] + offsets[quadrant];
        }
    }
    return matrix;
}

const BAYER_8 = Uint8Array.from(buildBayer(8), (rank) => Math.round(((rank + 0.5) / 64) * 255));

/** Blush appears early as sparse dots; full bloom only where several flowers overlap. */
const BLUSH_CUT = Uint8Array.from(BAYER_8, (threshold) => Math.round(threshold * 0.62));
const BLOOM_CUT = Uint8Array.from(BAYER_8, (threshold) => Math.round(206 + threshold * 0.19));

const pack = ([r, g, b]: Rgb) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

/**
 * Ordered dither of two channels at once. Blossom density picks between paper, blush and full
 * bloom (two cut-offs per cell); full bloom sits in front of ink, blush behind it.
 */
function ditherRows(source: Uint8ClampedArray, target: Uint32Array, width: number, height: number, colours: Uint32Array) {
    for (let y = 0; y < height; y++) {
        const row = (y & 7) << 3;
        for (let x = 0, at = y * width; x < width; x++, at++) {
            const cell = row | (x & 7);
            const blossom = source[at * 4 + 1];
            const bloom = (blossom > BLOOM_CUT[cell] ? 1 : 0) + (blossom > BLUSH_CUT[cell] ? 1 : 0);
            const ink = source[at * 4] > BAYER_8[cell] ? 1 : 0;
            target[at] = colours[bloom * 2 + ink];
        }
    }
}

/** Lookup indexed by bloomLevel * 2 + ink, so the hot loop has no branches on colour. */
function colourTable(palette: DitherPalette) {
    const ink = pack(palette.ink);
    const blush = pack(palette.blush);
    const bloom = pack(palette.bloom);
    return Uint32Array.from([0, ink, blush, ink, bloom, bloom]);
}

/**
 * A low-resolution density buffer (one pixel per dither cell) that scenes paint into with
 * ordinary Canvas 2D calls, and the dithered image made from it.
 */
export function createDitherSurface() {
    let density = makeCanvas(1, 1).getContext("2d", { willReadFrequently: true })!;
    let output = makeCanvas(1, 1);
    let outputContext = output.getContext("2d")!;
    let image = outputContext.createImageData(1, 1);
    let colours = colourTable({ ink: [0, 0, 0], blush: [0, 0, 0], bloom: [0, 0, 0] });

    const resize = (size: SceneSize) => {
        const columns = Math.ceil(size.width / CELL);
        const rows = Math.ceil(size.height / CELL);
        density = makeCanvas(columns, rows).getContext("2d", { willReadFrequently: true })!;
        output = makeCanvas(columns, rows);
        outputContext = output.getContext("2d")!;
        image = outputContext.createImageData(columns, rows);
    };

    /** Clears the buffer and returns it set up to draw in CSS pixels. */
    const begin = () => {
        density.setTransform(1, 0, 0, 1, 0, 0);
        density.globalCompositeOperation = "source-over";
        density.globalAlpha = 1;
        density.fillStyle = "#000";
        density.fillRect(0, 0, density.canvas.width, density.canvas.height);
        density.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
        return density;
    };

    /** Reads the buffer back, lets the scene write into its pixels directly, then dithers it. */
    const finish = (stamp?: (pixels: DensityPixels) => void) => {
        const { width, height } = density.canvas;
        const source = density.getImageData(0, 0, width, height).data;
        stamp?.({ data: source, columns: width, rows: height });
        ditherRows(source, new Uint32Array(image.data.buffer), width, height, colours);
        outputContext.putImageData(image, 0, 0);
        return output;
    };

    return {
        resize,
        begin,
        finish,
        setPalette(palette: DitherPalette) {
            colours = colourTable(palette);
        },
        get columns() {
            return density.canvas.width;
        },
        get rows() {
            return density.canvas.height;
        },
    };
}

export type DitherSurface = ReturnType<typeof createDitherSurface>;
