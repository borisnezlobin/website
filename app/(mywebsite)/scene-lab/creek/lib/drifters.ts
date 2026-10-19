import { sampleField, type LatticeFlow } from "./lattice-flow";

/**
 * A pool of massless points carried by the water, in lattice cells. Each point is moved with a
 * midpoint (RK2) step through the velocity field, so it follows curved streamlines around rocks
 * instead of cutting corners. Points that run into stone or leave the screen are removed by
 * swapping the last point into their slot, which keeps the arrays dense.
 */
export type Drifters = {
    capacity: number;
    count: number;
    x: Float32Array;
    y: Float32Array;
    age: Float32Array;
    life: Float32Array;
    /** Free per-point value: the source a streak came from, or a random seed. */
    tag: Float32Array;
};

export const createDrifters = (capacity: number): Drifters => ({
    capacity,
    count: 0,
    x: new Float32Array(capacity),
    y: new Float32Array(capacity),
    age: new Float32Array(capacity),
    life: new Float32Array(capacity),
    tag: new Float32Array(capacity),
});

export function addDrifter(pool: Drifters, x: number, y: number, life: number, tag: number) {
    if (pool.count >= pool.capacity) return false;
    const k = pool.count++;
    pool.x[k] = x; pool.y[k] = y; pool.age[k] = 0; pool.life[k] = life; pool.tag[k] = tag;
    return true;
}

function removeDrifter(pool: Drifters, k: number) {
    const last = --pool.count;
    pool.x[k] = pool.x[last]; pool.y[k] = pool.y[last];
    pool.age[k] = pool.age[last]; pool.life[k] = pool.life[last]; pool.tag[k] = pool.tag[last];
}

export const isWater = (flow: LatticeFlow, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= flow.cols || y >= flow.rows) return false;
    return flow.solid[(y | 0) * flow.cols + (x | 0)] === 0;
};

/** Moves one point `steps` lattice steps along the flow; returns false once it hits stone or leaves. */
function carry(pool: Drifters, flow: LatticeFlow, k: number, steps: number) {
    const { ux, uy, cols, rows } = flow;
    const x = pool.x[k], y = pool.y[k];
    const half = steps * 0.5;
    const mx = x + sampleField(ux, cols, rows, x, y) * half;
    const my = y + sampleField(uy, cols, rows, x, y) * half;
    const nx = x + sampleField(ux, cols, rows, mx, my) * steps;
    const ny = y + sampleField(uy, cols, rows, mx, my) * steps;
    pool.x[k] = nx; pool.y[k] = ny;
    return isWater(flow, nx, ny);
}

export function advectDrifters(pool: Drifters, flow: LatticeFlow, steps: number, delta: number) {
    for (let k = pool.count - 1; k >= 0; k--) {
        pool.age[k] += delta;
        const alive = carry(pool, flow, k, steps) && pool.age[k] < pool.life[k];
        if (!alive) removeDrifter(pool, k);
    }
}

/** 0..1: fades a point in over its first moments and out over the last part of its life. */
export function drifterFade(pool: Drifters, k: number, fadeIn: number, fadeOut: number) {
    const age = pool.age[k], left = pool.life[k] - age;
    return Math.min(1, age / fadeIn, left / fadeOut);
}
