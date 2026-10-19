import { channelPath, creekScale, rockShapes, type RockShape } from "./creek-layout";
import { createCreekCurrents, type CreekCurrents } from "./creek-currents";
import { createFlowGrid, type FlowGrid } from "./flow-grid";
import { createFlowProbe, SNAG_RADIUS, type FlowProbe } from "./flow-probe";
import type { CreekPalette } from "./palette";
import { createRockFacetLayer, type RockFacetLayer } from "./rock-facets";
import { takePointerMotion, type CanvasSize, type PointerTrail } from "./stage";

/**
 * What every creek direction shares for one canvas size: the lattice flow with its foam and
 * bubbles, the rocks painted with spin-drive facets, the channel outline and the probe that
 * floating things (the gallery prints) read the water through.
 */
export type CreekBed = {
    size: CanvasSize;
    grid: FlowGrid;
    currents: CreekCurrents;
    rocks: RockShape[];
    facets: RockFacetLayer;
    channel: Path2D;
    probe: FlowProbe;
};

export const STEPS_PER_SECOND = 340;

const MAX_WAKE_FORCE = 0.05;
const clampForce = (value: number) => Math.max(-MAX_WAKE_FORCE, Math.min(MAX_WAKE_FORCE, value));

/** A print moving through the water slows it a little behind itself and whips up a trace of foam. */
function wakeInto(grid: FlowGrid, currents: CreekCurrents) {
    return (gx: number, gy: number, fx: number, fy: number, size: number) => {
        grid.flow.push(gx, gy, clampForce(fx * 0.04), clampForce(fy * 0.04), size * 0.5);
        const strength = Math.hypot(fx, fy);
        if (strength > 0.02) currents.stir(gx, gy, Math.min(0.12, strength * 0.6));
    };
}

const snagRocks = (rocks: RockShape[], width: number, height: number) =>
    rocks.filter((rock) => rock.radius >= SNAG_RADIUS * creekScale(width, height));

export function buildCreekBed(size: CanvasSize, facetCell: number): CreekBed {
    const { width, height, dpr } = size;
    const grid = createFlowGrid(width, height);
    const currents = createCreekCurrents(grid);
    const rocks = rockShapes(width, height);
    return {
        size, grid, currents, rocks,
        facets: createRockFacetLayer(width, height, dpr, { cell: facetCell, rocks, intensity: 1.15 }),
        channel: channelPath(width, height),
        probe: createFlowProbe(grid, { width, height, snags: snagRocks(rocks, width, height) }, STEPS_PER_SECOND, wakeInto(grid, currents)),
    };
}

export function advanceBed(bed: CreekBed, steps: number, delta: number) {
    bed.grid.flow.step(steps);
    bed.currents.update(steps, delta);
}

/** Paper, the water's tint, then the stone with its facets on top and a wet rim where it meets the water. */
export function paintBed(ctx: CanvasRenderingContext2D, bed: CreekBed, palette: CreekPalette) {
    const { width, height, dpr } = bed.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = palette.water;
    ctx.fill(bed.channel);
    ctx.fillStyle = palette.stone;
    ctx.fill(bed.facets.silhouette);
    ctx.drawImage(bed.facets.canvas, 0, 0, width, height);
    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = 1.25;
    ctx.stroke(bed.facets.silhouette);
}

const MAX_STIR = 0.12;
const clampStir = (value: number) => Math.max(-MAX_STIR, Math.min(MAX_STIR, value));

/** Dragging over the water pushes it along and froths it a little; pressing pushes harder. */
export function stirFromPointer(bed: CreekBed, pointer: PointerTrail, steps: number) {
    if (!pointer.active || steps === 0) return;
    const { dx, dy } = takePointerMotion(pointer);
    const { cellPx, flow } = bed.grid;
    const strength = pointer.pressed ? 0.5 : 0.22;
    const gx = pointer.x / cellPx, gy = pointer.y / cellPx;
    flow.push(gx, gy, clampStir((dx / cellPx / steps) * strength), clampStir((dy / cellPx / steps) * strength), pointer.pressed ? 3.4 : 2.4);
    const moved = Math.hypot(dx, dy);
    if (moved > 0.5) bed.currents.stir(gx, gy, Math.min(0.3, moved * 0.01));
}
