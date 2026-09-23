import type { Mask } from "@/app/lib/spin-drive";

export type FacetSample = { density: number; brightness: number };

export type FacetSampler = (x: number, y: number, out: FacetSample) => void;

export const pairedMasks = (sample: FacetSampler): { mask: Mask; brightness: Mask } => {
    const out: FacetSample = { density: 0, brightness: 1 };
    let lastX = Number.NaN, lastY = Number.NaN;
    const read = (x: number, y: number) => {
        if (x !== lastX || y !== lastY) {
            out.density = 0;
            out.brightness = 1;
            sample(x, y, out);
            lastX = x;
            lastY = y;
        }
        return out;
    };
    return {
        mask: (x, y) => read(x, y).density,
        brightness: (x, y) => read(x, y).brightness,
    };
};
