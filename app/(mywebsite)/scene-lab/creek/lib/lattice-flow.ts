import { WATER, type ObstacleMask } from "./creek-layout";

/**
 * A D2Q9 lattice-Boltzmann solver: each cell keeps nine populations of fluid moving along the
 * lattice directions, they stream to the neighbours, bounce back off rocks and banks, and relax
 * towards equilibrium. A Smagorinsky eddy viscosity keeps it stable at the low viscosity that
 * lets the boulder shed a von Karman vortex street. Water enters along the top edge and leaves
 * through the bottom edge; speeds are in cells per step.
 */

const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
const WEIGHT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
const OPPOSITE = [0, 3, 4, 1, 2, 7, 8, 5, 6];
const Q = 9;
const MAX_SPEED = 0.26;
const FORCE_DECAY = 0.82;

export type LatticeFlowOptions = {
    inflowSpeed?: number;
    baseTau?: number;
    smagorinsky?: number;
};

export type LatticeFlow = {
    cols: number;
    rows: number;
    ux: Float32Array;
    uy: Float32Array;
    curl: Float32Array;
    solid: Uint8Array;
    inflowSpeed: number;
    step: (count: number) => void;
    updateCurl: () => void;
    push: (x: number, y: number, fx: number, fy: number, radius: number) => void;
};

const equilibrium = (i: number, rho: number, ux: number, uy: number) => {
    const cu = CX[i] * ux + CY[i] * uy;
    return WEIGHT[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * (ux * ux + uy * uy));
};

/**
 * Where each population of each cell is pulled from, as an index into the population array.
 * Pulling from a wall reflects the cell's own opposite population (bounce-back); pulling from
 * above the top edge reads the inflow slots stored after the last cell; the bottom edge reads
 * its own row again, which lets water leave freely.
 */
const sourceIndex = (solid: Uint8Array, cols: number, rows: number, k: number, i: number) => {
    const x = k % cols, y = (k / cols) | 0;
    const sx = x - CX[i];
    const sy = Math.min(rows - 1, y - CY[i]);
    if (sy < 0) return cols * rows * Q + i;
    const wall = sx < 0 || sx >= cols || solid[sy * cols + sx] === 1;
    return wall ? k * Q + OPPOSITE[i] : (sy * cols + sx) * Q + i;
};

const buildSources = (solid: Uint8Array, cols: number, rows: number) => {
    const sources = new Int32Array(cols * rows * Q);
    for (let k = 0; k < cols * rows; k++) {
        for (let i = 0; i < Q; i++) sources[k * Q + i] = sourceIndex(solid, cols, rows, k, i);
    }
    return sources;
};

const fillEquilibrium = (f: Float32Array, base: number, rho: number, ux: number, uy: number) => {
    for (let i = 0; i < Q; i++) f[base + i] = equilibrium(i, rho, ux, uy);
};

type Kernel = {
    f: Float32Array;
    next: Float32Array;
    sources: Int32Array;
    ux: Float32Array;
    uy: Float32Array;
    forceX: Float32Array;
    forceY: Float32Array;
    baseTau: number;
    smagorinskyTerm: number;
};

/**
 * Stream, then collide one cell with a Smagorinsky relaxation time. The collision is regularized:
 * only the stress part of the non-equilibrium populations survives, which removes the checkerboard
 * noise plain BGK shows this close to tau = 0.5. Unrolled for speed.
 */
const collide = (s: Kernel, k: number) => {
    const { f, sources: src } = s;
    const b = k * Q;
    const f0 = f[src[b]], f1 = f[src[b + 1]], f2 = f[src[b + 2]], f3 = f[src[b + 3]], f4 = f[src[b + 4]];
    const f5 = f[src[b + 5]], f6 = f[src[b + 6]], f7 = f[src[b + 7]], f8 = f[src[b + 8]];
    const rawRho = f0 + f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8;
    const rho = rawRho > 0.2 ? rawRho : 1;
    let vx = (f1 - f3 + f5 - f6 - f7 + f8) / rho + s.forceX[k];
    let vy = (f2 - f4 + f5 + f6 - f7 - f8) / rho + s.forceY[k];
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MAX_SPEED) { vx *= MAX_SPEED / speed; vy *= MAX_SPEED / speed; }
    s.ux[k] = vx; s.uy[k] = vy;
    const usq = 1.5 * (vx * vx + vy * vy);
    const r9 = rho / 9, r36 = rho / 36;
    const e0 = rho * (4 / 9) * (1 - usq);
    const e1 = r9 * (1 + 3 * vx + 4.5 * vx * vx - usq), e3 = e1 - r9 * 6 * vx;
    const e2 = r9 * (1 + 3 * vy + 4.5 * vy * vy - usq), e4 = e2 - r9 * 6 * vy;
    const a = vx + vy, d = vx - vy;
    const e5 = r36 * (1 + 3 * a + 4.5 * a * a - usq), e7 = e5 - r36 * 6 * a;
    const e8 = r36 * (1 + 3 * d + 4.5 * d * d - usq), e6 = e8 - r36 * 6 * d;
    const n1 = f1 - e1, n2 = f2 - e2, n3 = f3 - e3, n4 = f4 - e4;
    const n5 = f5 - e5, n6 = f6 - e6, n7 = f7 - e7, n8 = f8 - e8;
    const diagonal = n5 + n6 + n7 + n8;
    const pxx = n1 + n3 + diagonal, pyy = n2 + n4 + diagonal, pxy = n5 - n6 + n7 - n8;
    const stress = Math.sqrt(pxx * pxx + pyy * pyy + 2 * pxy * pxy);
    const tau = 0.5 * (s.baseTau + Math.sqrt(s.baseTau * s.baseTau + s.smagorinskyTerm * stress / rho));
    const keep = 1 - 1 / tau;
    const trace = (pxx + pyy) / 12, shear = pxy / 4;
    const out = s.next;
    out[b] = e0 - keep * (2 / 3) * (pxx + pyy);
    const alongX = keep * (2 * pxx - pyy) / 6, alongY = keep * (2 * pyy - pxx) / 6;
    out[b + 1] = e1 + alongX; out[b + 3] = e3 + alongX;
    out[b + 2] = e2 + alongY; out[b + 4] = e4 + alongY;
    const rising = keep * (trace + shear), falling = keep * (trace - shear);
    out[b + 5] = e5 + rising; out[b + 7] = e7 + rising;
    out[b + 6] = e6 + falling; out[b + 8] = e8 + falling;
};

export function createLatticeFlow(mask: ObstacleMask, options: LatticeFlowOptions = {}): LatticeFlow {
    const { cols, rows } = mask;
    const n = cols * rows;
    const inflowSpeed = options.inflowSpeed ?? 0.06;
    const smagorinsky = options.smagorinsky ?? 0.05;
    const solid = new Uint8Array(n);
    for (let k = 0; k < n; k++) solid[k] = mask.kind[k] === WATER ? 0 : 1;
    const water = Int32Array.from({ length: n }, (_, k) => k).filter((k) => !solid[k]);
    const kernel: Kernel = {
        f: new Float32Array((n + 1) * Q),
        next: new Float32Array((n + 1) * Q),
        sources: buildSources(solid, cols, rows),
        ux: new Float32Array(n),
        uy: new Float32Array(n),
        forceX: new Float32Array(n),
        forceY: new Float32Array(n),
        baseTau: options.baseTau ?? 0.511,
        smagorinskyTerm: 18 * smagorinsky * smagorinsky,
    };
    const curl = new Float32Array(n);
    let clock = 0;

    const startingSway = (k: number) => inflowSpeed * 0.25 * Math.sin((k / cols) * 0.21) * Math.sin((k % cols) * 0.05);
    for (let k = 0; k <= n; k++) {
        const still = k < n && solid[k] === 1;
        fillEquilibrium(kernel.f, k * Q, 1, still ? 0 : startingSway(k), still ? 0 : inflowSpeed);
    }

    const inflowSway = () => inflowSpeed * 0.05 * Math.sin(clock * 0.0031) * Math.sin(clock * 0.0007 + 1);

    const stepOnce = () => {
        fillEquilibrium(kernel.f, n * Q, 1, inflowSway(), inflowSpeed);
        for (let w = 0; w < water.length; w++) collide(kernel, water[w]);
        [kernel.f, kernel.next] = [kernel.next, kernel.f];
        clock++;
    };

    const decayForces = () => {
        for (let k = 0; k < n; k++) { kernel.forceX[k] *= FORCE_DECAY; kernel.forceY[k] *= FORCE_DECAY; }
    };

    const { ux, uy } = kernel;
    const updateCurl = () => {
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                const k = y * cols + x;
                curl[k] = solid[k] ? 0 : 0.5 * (uy[k + 1] - uy[k - 1] - ux[k + cols] + ux[k - cols]);
            }
        }
    };

    const push = (x: number, y: number, fx: number, fy: number, radius: number) => {
        const r2 = radius * radius;
        const x0 = Math.max(0, Math.floor(x - radius * 2)), x1 = Math.min(cols - 1, Math.ceil(x + radius * 2));
        const y0 = Math.max(0, Math.floor(y - radius * 2)), y1 = Math.min(rows - 1, Math.ceil(y + radius * 2));
        for (let j = y0; j <= y1; j++) {
            for (let i = x0; i <= x1; i++) {
                const falloff = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / r2);
                kernel.forceX[j * cols + i] += fx * falloff;
                kernel.forceY[j * cols + i] += fy * falloff;
            }
        }
    };

    return {
        cols, rows, ux, uy, curl, solid, inflowSpeed,
        step: (count) => {
            for (let s = 0; s < count; s++) stepOnce();
            decayForces();
        },
        updateCurl,
        push,
    };
}

/** Bilinear sample of a cell-centred field at grid position (x, y). */
export function sampleField(field: Float32Array, cols: number, rows: number, x: number, y: number) {
    const fx = Math.min(cols - 1.001, Math.max(0, x - 0.5));
    const fy = Math.min(rows - 1.001, Math.max(0, y - 0.5));
    const i = fx | 0, j = fy | 0;
    const tx = fx - i, ty = fy - j;
    const k = j * cols + i;
    const top = field[k] + (field[k + 1] - field[k]) * tx;
    const bottom = field[k + cols] + (field[k + cols + 1] - field[k + cols]) * tx;
    return top + (bottom - top) * ty;
}
