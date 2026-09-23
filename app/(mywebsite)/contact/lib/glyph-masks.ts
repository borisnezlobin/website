import { smoothstep } from "./smoothstep";

export const SAMPLES_PER_CELL = 3;
const GLYPH_BOX_OF_HEIGHT = 0.95;

export type GlyphGrids = {
    cols: number;
    rows: number;
    w: number;
    h: number;
    stations: Float32Array[];
};

function loadSvg(markup: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    });
}

function densityFromAlpha(pixels: Uint8ClampedArray) {
    const density = new Float32Array(pixels.length / 4);
    for (let k = 0; k < density.length; k++) density[k] = smoothstep(0.15, 0.7, pixels[k * 4 + 3] / 255);
    return density;
}

function rasterize(image: HTMLImageElement, cols: number, rows: number, sample: number, h: number) {
    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return new Float32Array(cols * rows);
    const side = (h * GLYPH_BOX_OF_HEIGHT) / sample;
    ctx.drawImage(image, (cols - side) / 2, (rows - side) / 2, side, side);
    return densityFromAlpha(ctx.getImageData(0, 0, cols, rows).data);
}

export async function buildGlyphGrids(svgMarkup: string[], w: number, h: number, cell: number): Promise<GlyphGrids> {
    const sample = cell / SAMPLES_PER_CELL;
    const cols = Math.ceil(w / sample), rows = Math.ceil(h / sample);
    const images = await Promise.all(svgMarkup.map(loadSvg));
    return { cols, rows, w, h, stations: images.map((image) => rasterize(image, cols, rows, sample, h)) };
}

export function serializeIcons(container: HTMLElement) {
    const serializer = new XMLSerializer();
    return Array.from(container.querySelectorAll("svg"), (svg) => serializer.serializeToString(svg));
}
