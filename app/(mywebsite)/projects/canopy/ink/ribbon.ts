export type RibbonPath = { xs: Float32Array; ys: Float32Array; widths: Float32Array; length: number };

export function makeRibbonPath(capacity: number): RibbonPath {
    return { xs: new Float32Array(capacity), ys: new Float32Array(capacity), widths: new Float32Array(capacity), length: 0 };
}

function normalAt(path: RibbonPath, index: number) {
    const before = Math.max(0, index - 1);
    const after = Math.min(path.length - 1, index + 1);
    const dx = path.xs[after] - path.xs[before];
    const dy = path.ys[after] - path.ys[before];
    const length = Math.hypot(dx, dy) || 1;
    return { nx: -dy / length, ny: dx / length };
}

/**
 * Traces a tapered ribbon around a polyline. `offset` slides the ribbon sideways and `scale`
 * narrows it, both as shares of the local width, which is how limbs get a lit edge.
 */
export function traceRibbon(ctx: CanvasRenderingContext2D, path: RibbonPath, offset = 0, scale = 1) {
    if (path.length < 2) return;
    const left: number[] = [];
    for (let i = 0; i < path.length; i++) {
        const { nx, ny } = normalAt(path, i);
        const half = path.widths[i] * 0.5;
        const centre = offset * half;
        const reach = scale * half;
        const lx = path.xs[i] + nx * (centre + reach);
        const ly = path.ys[i] + ny * (centre + reach);
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
        left.push(path.xs[i] + nx * (centre - reach), path.ys[i] + ny * (centre - reach));
    }
    for (let i = left.length - 2; i >= 0; i -= 2) ctx.lineTo(left[i], left[i + 1]);
    ctx.closePath();
}
