/** mulberry32: small, fast and seedable, so a layout is the same on every load. */
export function seededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const between = (random: () => number, min: number, max: number) => min + (max - min) * random();

export const pick = <T>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)];

export const signedUnit = (random: () => number) => random() * 2 - 1;
