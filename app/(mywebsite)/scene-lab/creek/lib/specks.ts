import { addDrifter, advectDrifters, createDrifters, isWater, type Drifters } from "./drifters";
import type { FlowGrid } from "./flow-grid";

/**
 * Specks floating on the surface, spread evenly over the water. They are what makes still-looking
 * water read as moving: each one is a faint mark that drifts with the current. New specks enter
 * along the top edge at the rate the water brings them in, and a few are re-scattered every frame
 * so eddies never empty out or clump.
 */
export type Specks = { pool: Drifters; update: (steps: number, delta: number) => void; scatter: () => void };

const SPECKS_PER_CELL = 0.3;
const RESCATTER_PER_SECOND = 0.035;
const LIFE = 60;

function randomWaterPoint(grid: FlowGrid, tries = 20) {
    for (let t = 0; t < tries; t++) {
        const x = Math.random() * grid.cols, y = Math.random() * grid.rows;
        if (isWater(grid.flow, x, y)) return { x, y };
    }
    return null;
}

const countWater = (grid: FlowGrid) => grid.flow.solid.reduce((sum, solid) => sum + (solid ? 0 : 1), 0);

export function createSpecks(grid: FlowGrid, cellArea: number): Specks {
    const target = Math.round((countWater(grid) * grid.cellPx * grid.cellPx / cellArea) * SPECKS_PER_CELL);
    const pool = createDrifters(target * 2);
    const topWater: number[] = [];
    for (let i = 0; i < grid.cols; i++) if (isWater(grid.flow, i + 0.5, 0.5)) topWater.push(i);
    const density = target / Math.max(1, countWater(grid));
    let inflowCarry = 0;

    const add = (x: number, y: number) => addDrifter(pool, x, y, LIFE * (0.6 + Math.random() * 0.8), Math.random());

    const feedTop = (steps: number) => {
        inflowCarry += topWater.length * grid.flow.inflowSpeed * steps * density;
        for (; inflowCarry >= 1; inflowCarry--) {
            add(topWater[(Math.random() * topWater.length) | 0] + Math.random(), Math.random() * grid.flow.inflowSpeed * steps);
        }
    };

    const rescatter = (delta: number) => {
        const count = Math.round(pool.count * RESCATTER_PER_SECOND * delta + Math.random());
        for (let n = 0; n < count && pool.count > 0; n++) {
            const k = (Math.random() * pool.count) | 0;
            const point = randomWaterPoint(grid);
            if (!point) continue;
            pool.x[k] = point.x; pool.y[k] = point.y; pool.age[k] = 0;
        }
    };

    const topUp = (delta: number) => {
        const missing = Math.min(target - pool.count, Math.ceil(target * delta * 0.2));
        for (let n = 0; n < missing; n++) {
            const point = randomWaterPoint(grid);
            if (point) add(point.x, point.y);
        }
    };

    const scatter = () => {
        pool.count = 0;
        for (let n = 0; n < target; n++) {
            const point = randomWaterPoint(grid);
            if (point) add(point.x, point.y);
        }
        for (let k = 0; k < pool.count; k++) pool.age[k] = Math.random() * 2;
    };

    return {
        pool,
        scatter,
        update: (steps, delta) => {
            if (steps === 0) return;
            feedTop(steps);
            advectDrifters(pool, grid.flow, steps, delta);
            topUp(delta);
            rescatter(delta);
        },
    };
}
