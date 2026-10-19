import { sampleField } from "../lattice-flow";
import type { AsciiWater } from "./ascii-water";
import { streamlineMark, type CellCorners, type StreamlineMark } from "./streamline-glyphs";
import type { WaterSample } from "./water-glyphs";

/** Samples ψ once at every character-cell corner, so neighbouring cells share their corner values. */
export function samplePsiCorners(water: AsciiWater) {
    const { chars, streamlines, psiCorners } = water;
    const grid = water.bed.grid;
    const { cols, rows, cellPx } = grid;
    const stride = chars.cols + 1;
    for (let j = 0; j <= chars.rows; j++) {
        const gy = (j * chars.cellH) / cellPx;
        for (let i = 0; i <= chars.cols; i++) psiCorners[j * stride + i] = sampleField(streamlines.psi, cols, rows, (i * chars.cellW) / cellPx, gy);
    }
}

const corners: CellCorners = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
const mark: StreamlineMark = { code: 0, level: 0 };

function sampleStreamline(water: AsciiWater, i: number, j: number, gx: number, gy: number, sample: WaterSample) {
    const { chars, psiCorners, lineStyle } = water;
    const grid = water.bed.grid;
    const stride = chars.cols + 1, top = j * stride + i, bottom = top + stride;
    corners.topLeft = psiCorners[top]; corners.topRight = psiCorners[top + 1];
    corners.bottomLeft = psiCorners[bottom]; corners.bottomRight = psiCorners[bottom + 1];
    const travel = sampleField(water.streamlines.travel.values, grid.cols, grid.rows, gx, gy);
    const found = streamlineMark(corners, travel, sample.time, lineStyle, { w: chars.cellW, h: chars.cellH }, mark);
    sample.line = found ? mark.code : 0;
    sample.lineLevel = mark.level;
}

export function sampleWater(water: AsciiWater, k: number, sample: WaterSample) {
    const { chars } = water;
    const { grid, currents } = water.bed;
    const { flow, cols, rows, cellPx } = grid;
    const i = k % chars.cols, j = (k / chars.cols) | 0;
    const y = (j + 0.5) * chars.cellH;
    const gx = ((i + 0.5) * chars.cellW) / cellPx, gy = y / cellPx;
    sample.y = y;
    sample.shallow = chars.shallow[k];
    sample.across = chars.across[k];
    sample.vx = sampleField(flow.ux, cols, rows, gx, gy) / flow.inflowSpeed;
    sample.vy = sampleField(flow.uy, cols, rows, gx, gy) / flow.inflowSpeed;
    sample.spin = sampleField(flow.curl, cols, rows, gx, gy) / flow.inflowSpeed;
    sample.foam = sampleField(currents.foam.values, cols, rows, gx, gy);
    sample.speck = water.speckInk[k];
    sample.hash = chars.noise[k];
    sampleStreamline(water, i, j, gx, gy, sample);
}
