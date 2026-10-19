import { contactAt, measureClearance, type Contact } from "./clearance";
import { BANK, rockDepth, type RockShape } from "./creek-layout";
import type { FlowGrid } from "./flow-grid";
import { sampleField } from "./lattice-flow";

/**
 * The water as seen by things floating on it, in CSS pixels and seconds, so a floating layer
 * (paper prints, drifting text) never needs to know about lattice cells or steps.
 */
export type FlowProbe = {
    width: number;
    height: number;
    /** Surface velocity in px/s. */
    velocity: (x: number, y: number, out: { x: number; y: number }) => void;
    /** How fast the water turns here in rad/s; positive is clockwise on screen. */
    spin: (x: number, y: number) => number;
    /** Distance to stone or bank in px, and the direction pointing away from it. */
    contact: (x: number, y: number, out: Contact) => Contact;
    /** A floating thing at (x, y) moving at (vx, vy) px/s relative to the water leaves a wake. */
    wake: (x: number, y: number, vx: number, vy: number, size: number) => void;
};

export type WakeSink = (gx: number, gy: number, fx: number, fy: number, size: number) => void;

/** Rocks smaller than this (as a share of the creek's scale) sit low enough for a print to slide over. */
export const SNAG_RADIUS = 0.08;

/**
 * What a floating print can run into: the banks and the rocks that stand proud of the water.
 * Pebbles are left out, so prints ride over them instead of jamming in the rapid.
 */
function snagMask(grid: FlowGrid, snags: RockShape[]) {
    const { cols, rows, cellPx, mask } = grid;
    const solid = new Uint8Array(cols * rows);
    for (let k = 0; k < solid.length; k++) {
        const x = ((k % cols) + 0.5) * cellPx, y = (((k / cols) | 0) + 0.5) * cellPx;
        solid[k] = mask.kind[k] === BANK || snags.some((rock) => rockDepth(rock, x, y) > 0) ? 1 : 0;
    }
    return solid;
}

export function createFlowProbe(grid: FlowGrid, size: { width: number; height: number; snags: RockShape[] }, stepsPerSecond: number, wake: WakeSink): FlowProbe {
    const { width, height } = size;
    const { flow, cols, rows, cellPx } = grid;
    const clearance = measureClearance(snagMask(grid, size.snags), cols, rows);
    const toPxPerSecond = cellPx * stepsPerSecond;
    return {
        width,
        height,
        velocity: (x, y, out) => {
            out.x = sampleField(flow.ux, cols, rows, x / cellPx, y / cellPx) * toPxPerSecond;
            out.y = sampleField(flow.uy, cols, rows, x / cellPx, y / cellPx) * toPxPerSecond;
        },
        spin: (x, y) => sampleField(flow.curl, cols, rows, x / cellPx, y / cellPx) * stepsPerSecond * 0.5,
        contact: (x, y, out) => {
            contactAt(clearance, x / cellPx, y / cellPx, out);
            out.distance *= cellPx;
            return out;
        },
        wake: (x, y, vx, vy, size) => wake(x / cellPx, y / cellPx, vx / toPxPerSecond, vy / toPxPerSecond, size / cellPx),
    };
}
