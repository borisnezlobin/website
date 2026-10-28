import type { Signature } from "./signature";

const INK: [number, number, number] = [43, 41, 40];
const WET: [number, number, number] = [204, 42, 38];
/** How many pixels of ink behind the pen are still wet, red like the flock that laid them. */
const WET_REACH = 150;
const SOFT_EDGE = 3;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Paints the part of the signature between `from` and `to` along its ink: the pen writes by
 * moving `to` forward and lifts the ink back off by moving `from` after it. Ink within
 * WET_REACH of `drying` is still wet.
 */
export function createSignaturePainter(signature: Signature) {
    const { box } = signature;
    const canvas = document.createElement("canvas");
    canvas.width = box.width;
    canvas.height = box.height;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(box.width, box.height);

    return (out: CanvasRenderingContext2D, from: number, to: number, drying: number) => {
        if (to <= from) return;
        const data = image.data;
        for (let i = 0; i < signature.alpha.length; i++) {
            const ink = signature.inkAt[i];
            const written = clamp01((to - ink) / SOFT_EDGE) * clamp01((ink - from) / SOFT_EDGE);
            const alpha = signature.alpha[i] * written;
            const wet = 1 - clamp01((drying - ink) / WET_REACH);
            data[i * 4] = INK[0] + (WET[0] - INK[0]) * wet;
            data[i * 4 + 1] = INK[1] + (WET[1] - INK[1]) * wet;
            data[i * 4 + 2] = INK[2] + (WET[2] - INK[2]) * wet;
            data[i * 4 + 3] = alpha;
        }
        ctx.putImageData(image, 0, 0);
        out.drawImage(canvas, box.left, box.top);
    };
}
