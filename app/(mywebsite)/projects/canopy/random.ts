export type Random = () => number;

/** mulberry32: a tiny seeded generator, so a tree grows the same way on every load. */
export function seededRandom(seed: number): Random {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

export const between = (random: Random, low: number, high: number) => low + (high - low) * random();

export const pick = <T>(random: Random, items: readonly T[]): T => items[Math.floor(random() * items.length) % items.length];

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};

export function wrapAngle(angle: number) {
    let wrapped = angle;
    while (wrapped > Math.PI) wrapped -= Math.PI * 2;
    while (wrapped < -Math.PI) wrapped += Math.PI * 2;
    return wrapped;
}

export const lerpAngle = (from: number, to: number, amount: number) => from + wrapAngle(to - from) * amount;

function hash1(n: number) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
}

/** Smooth 1D value noise in 0..1, for bristle breaks and wind turbulence. */
export function noise1(x: number) {
    const cell = Math.floor(x);
    const t = x - cell;
    const eased = t * t * (3 - 2 * t);
    return lerp(hash1(cell), hash1(cell + 1), eased);
}

function hash2(x: number, y: number) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}

/** Smooth 2D value noise in 0..1, for wind eddies that drift and change shape at the same time. */
export function noise2(x: number, y: number) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const tx = x - cellX;
    const ty = y - cellY;
    const easedX = tx * tx * (3 - 2 * tx);
    const easedY = ty * ty * (3 - 2 * ty);
    const top = lerp(hash2(cellX, cellY), hash2(cellX + 1, cellY), easedX);
    const bottom = lerp(hash2(cellX, cellY + 1), hash2(cellX + 1, cellY + 1), easedX);
    return lerp(top, bottom, easedY);
}
