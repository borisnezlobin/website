import { BUCKET_COUNT } from "./water-glyphs";

/**
 * Collects the frame's characters into one grid per ink level, with a flag per row that holds
 * anything, so the stamping pass skips empty rows and never has to sort glyphs by ink.
 */
export type GlyphRows = {
    cols: number;
    rows: number;
    codes: Uint16Array[];
    used: Uint8Array[];
    clear: () => void;
    put: (k: number, code: number, bucket: number) => void;
    /** Like `put`, but first removes whatever another ink level already drew in that cell. */
    replace: (k: number, code: number, bucket: number) => void;
};

const SPACE = 32;

export function createGlyphRows(cols: number, rows: number): GlyphRows {
    const codes = Array.from({ length: BUCKET_COUNT }, () => new Uint16Array(cols * rows).fill(SPACE));
    const used = Array.from({ length: BUCKET_COUNT }, () => new Uint8Array(rows));
    const put = (k: number, code: number, bucket: number) => {
        codes[bucket][k] = code;
        used[bucket][(k / cols) | 0] = 1;
    };
    return {
        cols, rows, codes, used, put,
        clear: () => {
            for (let b = 0; b < BUCKET_COUNT; b++) { codes[b].fill(SPACE); used[b].fill(0); }
        },
        replace: (k, code, bucket) => {
            for (let b = 0; b < BUCKET_COUNT; b++) codes[b][k] = SPACE;
            put(k, code, bucket);
        },
    };
}

export type InkLevel = { alpha: number; weight: number; red?: boolean };

export const DAY_LEVELS: InkLevel[] = [
    { alpha: 0.26, weight: 300 }, { alpha: 0.44, weight: 400 }, { alpha: 0.66, weight: 500 },
    { alpha: 0.9, weight: 700 }, { alpha: 0.95, weight: 700, red: true },
];
export const NIGHT_LEVELS: InkLevel[] = [
    { alpha: 0.22, weight: 300 }, { alpha: 0.38, weight: 400 }, { alpha: 0.6, weight: 500 },
    { alpha: 0.88, weight: 600 }, { alpha: 1, weight: 700, red: true },
];

export type TextMetrics = { fontFamily: string; fontSize: number; cellW: number; cellH: number };
