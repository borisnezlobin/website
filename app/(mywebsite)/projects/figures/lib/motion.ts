export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smoothstep = (edge0: number, edge1: number, x: number) => {
    const u = clamp01((x - edge0) / (edge1 - edge0));
    return u * u * (3 - 2 * u);
};

export const prefersStillFigure = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type LoopClock = { phase: number; elapsed: number; envelope: number };

export const loopClock = (seconds: number, period: number, fadeIn: number, fadeOut: number): LoopClock => {
    const elapsed = ((seconds % period) + period) % period;
    const envelope = Math.min(smoothstep(0, fadeIn, elapsed), 1 - smoothstep(period - fadeOut, period, elapsed));
    return { phase: elapsed / period, elapsed, envelope };
};
