import { banksAt, rockDepth, type RockShape } from "../creek-layout";

/**
 * The screen as a grid of monospace character cells. Banks and rocks don't move, so their glyphs
 * are worked out once per resize: the shoreline follows the slope of the bank, contour lines run
 * parallel to it like a survey map, and the paper gets a sparse stipple.
 */
export const CELL_WATER = 0;
export const CELL_BANK = 1;
export const CELL_ROCK = 2;

export const NO_GLYPH = 32;

export type CharGrid = {
    cols: number;
    rows: number;
    cellW: number;
    cellH: number;
    kind: Uint8Array;
    glyph: Uint16Array;
    bucket: Uint8Array;
    noise: Float32Array;
    /** For water cells: 1 at a bank or rock edge, fading to 0 a few cells out. */
    shallow: Float32Array;
    /** For water cells: -1 at the left bank, 0 mid-channel, 1 at the right bank. */
    across: Float32Array;
};

const code = (char: string) => char.charCodeAt(0);
const GLYPH = {
    vertical: code("|"), slash: code("/"), backslash: code("\\"), dot: code("."), comma: code(","),
    tick: code("'"), backtick: code("`"), colon: code(":"), dash: code("-"),
};

export const cellHash = (i: number, j: number) => {
    const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const shoreGlyph = (slope: number) => {
    if (slope > 0.6) return GLYPH.backslash;
    if (slope < -0.6) return GLYPH.slash;
    return GLYPH.vertical;
};

const STIPPLE = [GLYPH.dot, GLYPH.comma, GLYPH.tick, GLYPH.backtick];

const CONTOURS = [4, 9, 16, 26, 40];

/** Survey-map contour lines running parallel to the shore, spaced wider as the bank rises. */
const onContour = (cellsFromWater: number) => CONTOURS.some((at) => Math.abs(cellsFromWater - at) < 0.5);

type BankCell = { glyph: number; bucket: number };

/** Glyph for a bank cell `distance` pixels from the water, where `slope` is the shoreline's dx/dy. */
function bankCell(distance: number, slope: number, cellW: number, hash: number): BankCell {
    if (distance < cellW) return { glyph: shoreGlyph(slope), bucket: 3 };
    if (distance < cellW * 2.2) return { glyph: hash > 0.45 ? GLYPH.colon : GLYPH.dot, bucket: 1 };
    if (onContour(distance / cellW)) return { glyph: hash > 0.3 ? GLYPH.dot : NO_GLYPH, bucket: 1 };
    const sparse = Math.exp(-distance / (cellW * 6)) * 0.16 + 0.025;
    if (hash < sparse) return { glyph: STIPPLE[Math.floor(hash * 1000) % 4], bucket: 0 };
    return { glyph: NO_GLYPH, bucket: 0 };
}

type Shore = { left: number; right: number; leftSlope: number; rightSlope: number };

const shoreAt = (y: number, height: number, width: number, cellH: number): Shore => {
    const here = banksAt(y / height, width, height);
    const below = banksAt((y + cellH) / height, width, height);
    return { left: here.left, right: here.right, leftSlope: (below.left - here.left) / cellH, rightSlope: (below.right - here.right) / cellH };
};

const classifyBank = (grid: CharGrid, k: number, x: number, shore: Shore, hash: number) => {
    const onLeft = x < shore.left;
    const distance = onLeft ? shore.left - x : x - shore.right;
    const cell = bankCell(distance, onLeft ? shore.leftSlope : shore.rightSlope, grid.cellW, hash);
    grid.kind[k] = CELL_BANK;
    grid.glyph[k] = cell.glyph;
    grid.bucket[k] = cell.bucket;
};

const deepestRock = (rocks: RockShape[], x: number, y: number) => {
    let depth = -Infinity;
    for (const rock of rocks) depth = Math.max(depth, rockDepth(rock, x, y));
    return depth;
};

const SHALLOW_CELLS = 3.5;

const shallowness = (grid: CharGrid, toBank: number, rockDepth: number) =>
    Math.exp(-Math.min(toBank, -rockDepth) / (grid.cellW * SHALLOW_CELLS));

const classifyWaterOrRock = (grid: CharGrid, k: number, x: number, y: number, rocks: RockShape[], shore: Shore) => {
    const depth = deepestRock(rocks, x, y);
    grid.shallow[k] = shallowness(grid, Math.min(x - shore.left, shore.right - x), depth);
    grid.across[k] = (2 * (x - shore.left)) / Math.max(1, shore.right - shore.left) - 1;
    if (depth > grid.cellW * 0.9) { grid.kind[k] = CELL_ROCK; return; }
    grid.kind[k] = CELL_WATER;
};

export function buildCharGrid(width: number, height: number, cellW: number, cellH: number, rocks: RockShape[]): CharGrid {
    const cols = Math.ceil(width / cellW), rows = Math.ceil(height / cellH);
    const cells = cols * rows;
    const grid: CharGrid = {
        cols, rows, cellW, cellH,
        kind: new Uint8Array(cells), glyph: new Uint16Array(cells).fill(NO_GLYPH), bucket: new Uint8Array(cells),
        noise: new Float32Array(cells), shallow: new Float32Array(cells), across: new Float32Array(cells),
    };
    for (let j = 0; j < rows; j++) {
        const y = (j + 0.5) * cellH;
        const shore = shoreAt(y, height, width, cellH);
        for (let i = 0; i < cols; i++) {
            const k = j * cols + i, x = (i + 0.5) * cellW;
            grid.noise[k] = cellHash(i, j);
            const inBank = x < shore.left || x > shore.right;
            if (inBank) classifyBank(grid, k, x, shore, grid.noise[k]);
            else classifyWaterOrRock(grid, k, x, y, rocks, shore);
        }
    }
    return grid;
}
