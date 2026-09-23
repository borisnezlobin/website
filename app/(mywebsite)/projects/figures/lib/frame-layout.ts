export const WIDE_FIGURE_MIN_WIDTH = 640;

export const isWideFigure = (w: number) => w >= WIDE_FIGURE_MIN_WIDTH;

export const figureInsetX = (w: number) => Math.max(16, Math.round(w * 0.07));

export const labelSize = (w: number) => (isWideFigure(w) ? 12 : 11);
