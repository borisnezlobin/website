import type { Mask, SpinColors } from "@/app/lib/spin-drive";

export type FigureInstance = {
    mask: Mask;
    brightness?: Mask;
    beforeFrame?: (w: number, h: number, t: number) => void;
    overlay?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: SpinColors) => void;
};

export type FigureSpec = {
    cell: number;
    createInstance: () => FigureInstance;
};
