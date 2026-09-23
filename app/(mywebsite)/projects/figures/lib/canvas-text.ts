export const FIGURE_SERIF = "charter, Georgia, serif";
export const FIGURE_MONO = "\"Courier New\", ui-monospace, monospace";

export type LabelStyle = {
    size: number;
    color: string;
    alpha?: number;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    family?: string;
    weight?: number;
};

export const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: LabelStyle) => {
    ctx.font = `${style.weight ?? 400} ${style.size}px ${style.family ?? FIGURE_SERIF}`;
    ctx.fillStyle = style.color;
    ctx.globalAlpha = style.alpha ?? 1;
    ctx.textAlign = style.align ?? "left";
    ctx.textBaseline = style.baseline ?? "alphabetic";
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
};
