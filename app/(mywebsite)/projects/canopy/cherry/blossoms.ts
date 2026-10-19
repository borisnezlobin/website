import type { Arbor } from "../arbor/growth";
import type { NodeLocator } from "../arbor/sway";
import type { Point } from "../boids/types";
import type { Curtain } from "../curtain";
import { CELL, type DensityPixels } from "../dither/surface";
import { between, clamp, type Random } from "../random";

/** A blossom hangs either a share of the way down a strand or beside a node of wood. */
export type Blossom = { host: number; share: number; dx: number; dy: number; size: number };

export type BlossomSet = { onStrands: Blossom[]; onWood: Blossom[] };

/** Halo and heart opacity in the blossom channel. Overlapping flowers add up toward full bloom red. */
const HALO = 0.29;
const CORE = 0.17;
const CORE_SHARE = 0.42;
const SIZES = [2.6, 3.4, 4.4];

const pickSize = (random: Random, bias: number) => SIZES[Math.min(SIZES.length - 1, Math.floor(random() * SIZES.length * bias))];

/** CSS px of whip per knot of flowers on a tree hanging to its usual depth. */
const KNOT_SPACING = 15;

/** Flowers line each whip in little knots, heavier toward the tip like a real shidare-zakura. */
function strandBlossoms(random: Random, curtain: Curtain, knotSpacing: number): Blossom[] {
    const blossoms: Blossom[] = [];
    curtain.specs.forEach((spec, host) => {
        const knots = Math.max(2, Math.round(spec.length / knotSpacing));
        for (let knot = 0; knot < knots; knot++) {
            const share = Math.min(1, between(random, 0.08, 1.04));
            const flowers = 1 + Math.floor(random() * (0.9 + share * 1.5));
            for (let i = 0; i < flowers; i++) blossoms.push({ host, share, dx: between(random, -6.5, 6.5), dy: between(random, -5, 5), size: pickSize(random, 0.55 + share * 0.6) });
        }
    });
    return blossoms;
}

function woodBlossoms(random: Random, arbor: Arbor, floor: number): Blossom[] {
    const blossoms: Blossom[] = [];
    arbor.nodes.forEach((node, host) => {
        if (node.width > 7 || node.y > floor || random() > 0.32) return;
        const flowers = 1 + Math.floor(random() * 3);
        for (let i = 0; i < flowers; i++) blossoms.push({ host, share: 0, dx: between(random, -6, 6), dy: between(random, -5, 5), size: pickSize(random, 0.8) });
    });
    return blossoms;
}

/** `stretch` is how much longer than usual the whips hang; their knots spread out so the flower count stays the same. */
export function placeBlossoms(random: Random, arbor: Arbor, curtain: Curtain, floor: number, stretch = 1): BlossomSet {
    return { onStrands: strandBlossoms(random, curtain, KNOT_SPACING * stretch), onWood: woodBlossoms(random, arbor, floor) };
}

/** Non-zero taps of a disc, as cell offsets and weights, so stamping skips the empty corners. */
type Kernel = { radius: number; offsetX: Int8Array; offsetY: Int8Array; weights: Uint8Array };

/** A soft-edged disc of blossom density: a pale halo with a denser heart. */
function buildKernel(size: number): Kernel {
    const outer = size / CELL;
    const inner = outer * CORE_SHARE;
    const radius = Math.ceil(outer);
    const taps: [number, number, number][] = [];
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const distance = Math.hypot(x, y);
            const coverage = (edge: number) => clamp(edge - distance + 0.5, 0, 1);
            const weight = Math.round(255 * (HALO * coverage(outer) + CORE * coverage(inner)));
            if (weight > 0) taps.push([x, y, weight]);
        }
    }
    return {
        radius,
        offsetX: Int8Array.from(taps, ([x]) => x),
        offsetY: Int8Array.from(taps, ([, y]) => y),
        weights: Uint8Array.from(taps, ([, , weight]) => weight),
    };
}

const KERNELS = new Map(SIZES.map((size) => [size, buildKernel(size)]));

/** Adds a kernel into the green channel, saturating at full bloom. Off-screen taps are dropped. */
function stampKernel(pixels: DensityPixels, kernel: Kernel, x: number, y: number) {
    const centreX = Math.round(x / CELL);
    const centreY = Math.round(y / CELL);
    const { columns, rows, data } = pixels;
    const inside = centreX >= kernel.radius && centreY >= kernel.radius && centreX < columns - kernel.radius && centreY < rows - kernel.radius;
    for (let tap = 0; tap < kernel.weights.length; tap++) {
        const cellX = centreX + kernel.offsetX[tap];
        const cellY = centreY + kernel.offsetY[tap];
        if (!inside && (cellX < 0 || cellY < 0 || cellX >= columns || cellY >= rows)) continue;
        const at = (cellY * columns + cellX) * 4 + 1;
        data[at] = Math.min(255, data[at] + kernel.weights[tap]);
    }
}

const point: Point = { x: 0, y: 0 };

/**
 * Stamps every blossom straight into the density pixels. Overlapping flowers add up, so dense
 * knots tip from blush into full bloom red while lone flowers stay pale.
 */
export function stampBlossoms(pixels: DensityPixels, blossoms: BlossomSet, curtain: Curtain, locate: NodeLocator) {
    for (const blossom of blossoms.onStrands) {
        curtain.pointAt(blossom.host, blossom.share, point);
        stampKernel(pixels, KERNELS.get(blossom.size)!, point.x + blossom.dx, point.y + blossom.dy);
    }
    for (const blossom of blossoms.onWood) {
        locate(blossom.host, point);
        stampKernel(pixels, KERNELS.get(blossom.size)!, point.x + blossom.dx, point.y + blossom.dy);
    }
}

/** A spot to drop a petal from: somewhere among the flowers on the whips. */
export function petalOrigin(random: Random, blossoms: BlossomSet, curtain: Curtain, out: Point) {
    if (!blossoms.onStrands.length) return false;
    const blossom = blossoms.onStrands[Math.floor(random() * blossoms.onStrands.length)];
    curtain.pointAt(blossom.host, blossom.share, out);
    out.x += blossom.dx;
    out.y += blossom.dy;
    return true;
}
