/**
 * The creek seen from directly above, flowing from the top of the screen to the bottom.
 * Everything is described in normalized terms so the same creek fits a laptop and a phone:
 * the channel's centre and half-width are functions of the downstream position `y` (0..1),
 * and rocks sit at a downstream position plus a cross-stream offset relative to the local banks.
 *
 * A hand-drawn PNG (black = rock or bank, white = water) can replace all of this through
 * `maskFromImage`, which returns the same `ObstacleMask` shape as `rasterizeLayout`.
 */

export const WATER = 0;
export const BANK = 1;
export const ROCK = 2;
export type CellKind = typeof WATER | typeof BANK | typeof ROCK;

export type ObstacleMask = { cols: number; rows: number; kind: Uint8Array };

export type Rock = {
    /** Downstream position, 0 at the top edge and 1 at the bottom edge. */
    y: number;
    /** Cross-stream position, -1 on the left bank and 1 on the right bank. */
    across: number;
    /** Radius as a fraction of the creek scale (see `creekScale`). */
    radius: number;
    seed: number;
    /** Lengthens the rock along the current; water polishes stones into this shape. */
    stretch?: number;
};

export type CreekLayout = {
    rocks: Rock[];
    centre: (y: number) => number;
    halfWidth: (y: number) => number;
};

const TAU = Math.PI * 2;

const meander = (y: number) => 0.4 * Math.sin(y * TAU * 0.55 + 0.7) + 0.14 * Math.sin(y * TAU * 1.3 - 0.4);

const narrowsAt = (y: number, at: number, width: number) => Math.exp(-(((y - at) / width) ** 2));

const halfWidthProfile = (y: number) =>
    1 - 0.22 * narrowsAt(y, 0.66, 0.09) + 0.14 * narrowsAt(y, 0.3, 0.16) + 0.06 * Math.sin(y * TAU * 2.3 + 1.1);

/** Cross-stream positions are scaled per screen in `channelAt`; these are only the shapes. */
export const CREEK_LAYOUT: CreekLayout = {
    centre: meander,
    halfWidth: halfWidthProfile,
    rocks: [
        { y: 0.19, across: -0.12, radius: 0.15, seed: 1.3, stretch: 1.12 },
        { y: 0.07, across: 0.62, radius: 0.028, seed: 4.1 },
        { y: 0.36, across: -0.78, radius: 0.022, seed: 7.7 },
        { y: 0.44, across: 0.66, radius: 0.04, seed: 2.9 },
        { y: 0.6, across: -0.55, radius: 0.075, seed: 3.3 },
        { y: 0.63, across: 0.05, radius: 0.06, seed: 5.2 },
        { y: 0.665, across: 0.32, radius: 0.085, seed: 6.4 },
        { y: 0.7, across: -0.24, radius: 0.045, seed: 8.8 },
        { y: 0.735, across: 0.24, radius: 0.035, seed: 9.6 },
        { y: 0.83, across: 0.92, radius: 0.09, seed: 11.2 },
        { y: 0.88, across: -0.5, radius: 0.03, seed: 12.5 },
        { y: 0.95, across: 0.3, radius: 0.04, seed: 13.9 },
    ],
};

const isPortrait = (width: number, height: number) => width < height * 0.8;

/** The size of the creek in the surface's units: wide on a laptop, most of the width on a phone. */
export const creekScale = (width: number, height: number) => Math.min(width * (isPortrait(width, height) ? 0.36 : 0.42), height * 0.4);

export type Channel = { centre: number; halfWidth: number };

const bankWobble = (y: number, side: number) =>
    0.035 * Math.sin(y * 47 + side * 3.1) + 0.02 * Math.sin(y * 113 + side * 1.7) + 0.012 * Math.sin(y * 271 + side);

/** The channel at downstream position `y` in pixels of a `width` x `height` surface. */
export function channelAt(y: number, width: number, height: number, layout = CREEK_LAYOUT): Channel {
    const scale = creekScale(width, height);
    const halfWidth = layout.halfWidth(y) * scale;
    const room = Math.max(0, width / 2 - halfWidth - width * 0.04);
    return { centre: width / 2 + layout.centre(y) * room, halfWidth };
}

/** The left and right bank edges in pixels, with the small irregularities of a real bank. */
export function banksAt(y: number, width: number, height: number, layout = CREEK_LAYOUT) {
    const { centre, halfWidth } = channelAt(y, width, height, layout);
    const scale = creekScale(width, height);
    return {
        left: centre - halfWidth + bankWobble(y, -1) * scale,
        right: centre + halfWidth + bankWobble(y, 1) * scale,
    };
}

const CHANNEL_SAMPLES = 160;

/** The water's outline (both banks joined across the top and bottom edges), in pixels. */
export function channelPath(width: number, height: number, layout = CREEK_LAYOUT) {
    const path = new Path2D();
    const edges = Array.from({ length: CHANNEL_SAMPLES + 1 }, (_, s) => banksAt(s / CHANNEL_SAMPLES, width, height, layout));
    edges.forEach((edge, s) => path.lineTo(edge.left, (s / CHANNEL_SAMPLES) * height));
    for (let s = CHANNEL_SAMPLES; s >= 0; s--) path.lineTo(edges[s].right, (s / CHANNEL_SAMPLES) * height);
    path.closePath();
    return path;
}

export type RockShape = {
    x: number;
    y: number;
    radius: number;
    stretch: number;
    seed: number;
    /** Distance from the centre to the rock's edge in direction `angle`, in pixels. */
    edge: (angle: number) => number;
};

const rockEdge = (radius: number, seed: number) => (angle: number) =>
    radius * (1 + 0.11 * Math.sin(3 * angle + seed) + 0.07 * Math.sin(5 * angle + seed * 2.3) + 0.035 * Math.sin(9 * angle + seed * 4.1));

/** Each rock placed in pixels of a `width` x `height` surface. */
export function rockShapes(width: number, height: number, layout = CREEK_LAYOUT): RockShape[] {
    const scale = creekScale(width, height);
    return layout.rocks.map((rock) => {
        const { centre, halfWidth } = channelAt(rock.y, width, height, layout);
        const radius = rock.radius * scale;
        return {
            x: centre + rock.across * halfWidth,
            y: rock.y * height,
            radius,
            stretch: rock.stretch ?? 1.06,
            seed: rock.seed,
            edge: rockEdge(radius, rock.seed),
        };
    });
}

/** Positive inside the rock, negative outside, in pixels (approximately). */
export function rockDepth(rock: RockShape, x: number, y: number) {
    const dx = x - rock.x, dy = (y - rock.y) / rock.stretch;
    return rock.edge(Math.atan2(dy, dx)) - Math.hypot(dx, dy);
}

const isRock = (rocks: RockShape[], x: number, y: number) => rocks.some((rock) => rockDepth(rock, x, y) > 0);

/** Rasterizes the layout onto a `cols` x `rows` grid of square cells covering the surface. */
export function rasterizeLayout(cols: number, rows: number, layout = CREEK_LAYOUT): ObstacleMask {
    const kind = new Uint8Array(cols * rows);
    const rocks = rockShapes(cols, rows, layout);
    for (let j = 0; j < rows; j++) {
        const { left, right } = banksAt((j + 0.5) / rows, cols, rows, layout);
        for (let i = 0; i < cols; i++) {
            const x = i + 0.5, y = j + 0.5;
            const inBank = x < left || x > right;
            kind[j * cols + i] = inBank ? BANK : isRock(rocks, x, y) ? ROCK : WATER;
        }
    }
    return { cols, rows, kind };
}

/**
 * Builds the same mask from a drawn image (black = rock or bank, white = water), stretched over
 * the grid. Dark areas touching the left or right edge of a row count as bank, the rest as rock.
 */
export function maskFromImage(image: CanvasImageSource, cols: number, rows: number): ObstacleMask {
    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, cols, rows);
    const pixels = ctx.getImageData(0, 0, cols, rows).data;
    const kind = new Uint8Array(cols * rows);
    for (let k = 0; k < kind.length; k++) kind[k] = pixels[k * 4] < 128 ? ROCK : WATER;
    for (let j = 0; j < rows; j++) markBankRuns(kind, cols, j);
    return { cols, rows, kind };
}

const markBankRuns = (kind: Uint8Array, cols: number, row: number) => {
    for (let i = 0; i < cols && kind[row * cols + i] !== WATER; i++) kind[row * cols + i] = BANK;
    for (let i = cols - 1; i >= 0 && kind[row * cols + i] !== WATER; i--) kind[row * cols + i] = BANK;
};
