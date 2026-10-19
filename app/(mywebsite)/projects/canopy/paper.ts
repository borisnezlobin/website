import { between, seededRandom, type Random } from "./random";

export type PaperTone = { fibre: string; speck: string; grain: number };

export const PAPER_TONES = {
    light: { fibre: "rgba(120, 104, 88, 0.07)", speck: "rgba(70, 60, 50, 0.16)", grain: 11 },
    dark: { fibre: "rgba(220, 205, 185, 0.045)", speck: "rgba(235, 220, 200, 0.08)", grain: 9 },
} satisfies Record<string, PaperTone>;

const TILE = 256;

export function makeCanvas(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));
    return canvas;
}

/** A repeating tile of signed grey noise, used as an overlay pattern. */
export function grainTile(random: Random, amplitude: number) {
    const tile = makeCanvas(TILE, TILE);
    const ctx = tile.getContext("2d")!;
    const image = ctx.createImageData(TILE, TILE);
    for (let i = 0; i < image.data.length; i += 4) {
        const value = random();
        const tone = value < 0.5 ? 0 : 255;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = tone;
        image.data[i + 3] = Math.abs(value - 0.5) * 2 * amplitude;
    }
    ctx.putImageData(image, 0, 0);
    return tile;
}

function drawFibres(ctx: CanvasRenderingContext2D, random: Random, width: number, height: number, tone: PaperTone) {
    ctx.strokeStyle = tone.fibre;
    ctx.lineCap = "round";
    const count = Math.round((width * height) / 2600);
    for (let i = 0; i < count; i++) {
        const x = random() * width;
        const y = random() * height;
        const angle = between(random, -0.5, 0.5) + (random() < 0.5 ? 0 : Math.PI / 2);
        const length = between(random, 4, 16);
        ctx.lineWidth = between(random, 0.3, 0.8);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(angle) * length * 0.5 + between(random, -2, 2), y + Math.sin(angle) * length * 0.5 + between(random, -2, 2), x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
    }
}

function drawSpecks(ctx: CanvasRenderingContext2D, random: Random, width: number, height: number, tone: PaperTone) {
    ctx.fillStyle = tone.speck;
    const count = Math.round((width * height) / 14000);
    for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(random() * width, random() * height, between(random, 0.25, 0.8), 0, Math.PI * 2);
        ctx.fill();
    }
}

/** Fibres, specks and grain without the flat tone, so the page's own background shows through. */
export function paintPaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number, tone: PaperTone, seed = 7) {
    const random = seededRandom(seed);
    drawFibres(ctx, random, width, height, tone);
    drawSpecks(ctx, random, width, height, tone);
    const pattern = ctx.createPattern(grainTile(random, tone.grain), "repeat");
    if (!pattern) return;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
}

/** Thins the texture out between two shares of the height and clears it below, where the scene meets the plain page. */
export function fadePaperBottom(ctx: CanvasRenderingContext2D, width: number, height: number, from: number, to: number) {
    const fade = ctx.createLinearGradient(0, height * from, 0, height * to);
    fade.addColorStop(0, "rgba(0, 0, 0, 0)");
    fade.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = fade;
    ctx.fillRect(0, height * from, width, height * (1 - from));
    ctx.globalCompositeOperation = "source-over";
}
