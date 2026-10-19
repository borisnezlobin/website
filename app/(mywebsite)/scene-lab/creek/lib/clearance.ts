import { sampleField } from "./lattice-flow";

/**
 * How far each lattice cell is from the nearest stone or bank, in cells, negative inside stone
 * (two two-pass chamfer distance transforms). Anything that floats uses it to bump off rocks: the
 * distance says how close it is, and the gradient says which way is out, even from inside a rock.
 */
export type Clearance = { cols: number; rows: number; distance: Float32Array };

const STRAIGHT = 1;
const DIAGONAL = Math.SQRT2;

function relax(distance: Float32Array, cols: number, k: number, neighbours: [number, number, number][]) {
    const x = k % cols;
    let best = distance[k];
    for (const [dx, dy, cost] of neighbours) {
        const nx = x + dx;
        if (nx < 0 || nx >= cols) continue;
        const n = k + dy * cols + dx;
        if (n < 0 || n >= distance.length) continue;
        best = Math.min(best, distance[n] + cost);
    }
    distance[k] = best;
}

const FORWARD: [number, number, number][] = [[-1, 0, STRAIGHT], [0, -1, STRAIGHT], [-1, -1, DIAGONAL], [1, -1, DIAGONAL]];
const BACKWARD: [number, number, number][] = [[1, 0, STRAIGHT], [0, 1, STRAIGHT], [1, 1, DIAGONAL], [-1, 1, DIAGONAL]];

const FAR = 1e6;

function chamfer(seeds: (k: number) => boolean, cols: number, cells: number) {
    const distance = new Float32Array(cells);
    for (let k = 0; k < cells; k++) distance[k] = seeds(k) ? 0 : FAR;
    for (let k = 0; k < cells; k++) relax(distance, cols, k, FORWARD);
    for (let k = cells - 1; k >= 0; k--) relax(distance, cols, k, BACKWARD);
    return distance;
}

export function measureClearance(solid: Uint8Array, cols: number, rows: number): Clearance {
    const cells = cols * rows;
    const toStone = chamfer((k) => solid[k] === 1, cols, cells);
    const toWater = chamfer((k) => solid[k] === 0, cols, cells);
    const distance = new Float32Array(cells);
    for (let k = 0; k < cells; k++) distance[k] = solid[k] ? 0.5 - toWater[k] : toStone[k] - 0.5;
    return { cols, rows, distance };
}

export type Contact = { distance: number; nx: number; ny: number };

/** Distance to stone at a grid position, and the unit direction pointing away from it. */
export function contactAt(clearance: Clearance, x: number, y: number, out: Contact) {
    const { distance, cols, rows } = clearance;
    out.distance = sampleField(distance, cols, rows, x, y);
    const gx = sampleField(distance, cols, rows, x + 1, y) - sampleField(distance, cols, rows, x - 1, y);
    const gy = sampleField(distance, cols, rows, x, y + 1) - sampleField(distance, cols, rows, x, y - 1);
    const length = Math.hypot(gx, gy) || 1;
    out.nx = gx / length;
    out.ny = gy / length;
    return out;
}
