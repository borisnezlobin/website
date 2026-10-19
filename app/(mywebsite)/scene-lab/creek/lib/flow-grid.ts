import { rasterizeLayout, type ObstacleMask } from "./creek-layout";
import { createLatticeFlow, type LatticeFlow, type LatticeFlowOptions } from "./lattice-flow";

/** A lattice sized for the surface: square cells, about `targetCells` of them. */
export type FlowGrid = { cols: number; rows: number; cellPx: number; mask: ObstacleMask; flow: LatticeFlow };

const MIN_CELL_PX = 3.5;

export function createFlowGrid(width: number, height: number, targetCells = 22000, options?: LatticeFlowOptions): FlowGrid {
    const cellPx = Math.max(MIN_CELL_PX, Math.sqrt((width * height) / targetCells));
    const cols = Math.max(8, Math.round(width / cellPx));
    const rows = Math.max(8, Math.round(height / cellPx));
    const mask = rasterizeLayout(cols, rows);
    return { cols, rows, cellPx: width / cols, mask, flow: createLatticeFlow(mask, options) };
}

/** Lattice steps per frame so the water moves at the same on-screen speed on every display. */
export function stepsFor(delta: number, stepsPerSecond: number, carry: { value: number }) {
    carry.value += delta * stepsPerSecond;
    const steps = Math.min(12, Math.floor(carry.value));
    carry.value -= steps;
    return steps;
}
