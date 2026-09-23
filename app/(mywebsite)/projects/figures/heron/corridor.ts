import { smoothstep } from "../lib/motion";
import { fieldToCanvasX, fieldToCanvasY, type HeronLayout } from "./field-layout";
import { PIECES, pointAlong } from "./autonomous-path";

export type CorridorGrid = {
    step: number;
    cols: number;
    rows: number;
    originX: number;
    originY: number;
    strength: Float32Array;
    piece: Int8Array;
    along: Float32Array;
};

const CORRIDOR_HALF_INCHES = 2.5;
const SAMPLE_INCHES = 0.5;

type Stamp = { x: number; y: number; piece: number; along: number };

const stampSample = (grid: CorridorGrid, nearest: Float32Array, radius: number, s: Stamp) => {
    const c0 = Math.max(0, Math.floor((s.x - radius - grid.originX) / grid.step));
    const c1 = Math.min(grid.cols - 1, Math.ceil((s.x + radius - grid.originX) / grid.step));
    const r0 = Math.max(0, Math.floor((s.y - radius - grid.originY) / grid.step));
    const r1 = Math.min(grid.rows - 1, Math.ceil((s.y + radius - grid.originY) / grid.step));
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const d = Math.hypot(grid.originX + (c + 0.5) * grid.step - s.x, grid.originY + (r + 0.5) * grid.step - s.y);
            const index = r * grid.cols + c;
            if (d >= radius || d >= nearest[index]) continue;
            nearest[index] = d;
            grid.piece[index] = s.piece;
            grid.along[index] = s.along;
        }
    }
};

const stampPiece = (grid: CorridorGrid, nearest: Float32Array, radius: number, layout: HeronLayout, piece: number) => {
    const count = Math.max(2, Math.ceil(PIECES[piece].total / SAMPLE_INCHES));
    for (let k = 0; k <= count; k++) {
        const along = k / count;
        const [fx, fy] = pointAlong(PIECES[piece], along);
        stampSample(grid, nearest, radius, { x: fieldToCanvasX(layout, fx), y: fieldToCanvasY(layout, fy), piece, along });
    }
};

export const buildCorridor = (layout: HeronLayout, cell: number): CorridorGrid => {
    const step = cell / 2;
    const cols = Math.ceil(layout.size / step) + 1, rows = cols;
    const grid: CorridorGrid = {
        step, cols, rows, originX: layout.left, originY: layout.top,
        strength: new Float32Array(cols * rows), piece: new Int8Array(cols * rows).fill(-1), along: new Float32Array(cols * rows),
    };
    const radius = Math.max(CORRIDOR_HALF_INCHES * layout.scale, cell);
    const nearest = new Float32Array(cols * rows).fill(Infinity);
    PIECES.forEach((_, piece) => stampPiece(grid, nearest, radius, layout, piece));
    for (let k = 0; k < nearest.length; k++) grid.strength[k] = 1 - smoothstep(radius * 0.55, radius, nearest[k]);
    return grid;
};

export const corridorCell = (grid: CorridorGrid, x: number, y: number) => {
    const c = Math.floor((x - grid.originX) / grid.step), r = Math.floor((y - grid.originY) / grid.step);
    if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return -1;
    return r * grid.cols + c;
};
