import { drifterFade, type Drifters } from "../drifters";
import type { CharGrid } from "./char-grid";

/**
 * Drops a pool of drifting points onto the character grid: every cell sums the ink of the points
 * inside it, so a streak that bunches up in slow water darkens and one stretched thin in the rapid
 * breaks into dashes.
 */
export type DrifterInk = { fadeIn: number; fadeOut: number; weight: number };

export function inkDrifters(pool: Drifters, chars: CharGrid, cellPx: number, ink: DrifterInk, out: Float32Array) {
    out.fill(0);
    const sx = cellPx / chars.cellW, sy = cellPx / chars.cellH;
    for (let k = 0; k < pool.count; k++) {
        const i = (pool.x[k] * sx) | 0, j = (pool.y[k] * sy) | 0;
        if (i < 0 || j < 0 || i >= chars.cols || j >= chars.rows) continue;
        out[j * chars.cols + i] += drifterFade(pool, k, ink.fadeIn, ink.fadeOut) * ink.weight;
    }
}
