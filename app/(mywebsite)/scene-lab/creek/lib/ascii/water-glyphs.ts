/**
 * Picks the character for one cell of moving water, in order of what the eye reads first:
 * whitewater, then the crests of the standing waves in the rapid, then the dashed streamlines,
 * then the stipple of spinning eddy cores, then the faint specks that show the surface moving. Everything else is left as paper (by day) or dark water (by night).
 */
export const BUCKET_FAINT = 0;
export const BUCKET_SOFT = 1;
export const BUCKET_MID = 2;
export const BUCKET_STRONG = 3;
export const BUCKET_RED = 4;
export const BUCKET_COUNT = 5;
export const HIDDEN = -1;

export type WaterSample = {
    /** Velocity relative to the inflow speed. */
    vx: number;
    vy: number;
    /** Curl relative to the inflow speed per cell. */
    spin: number;
    foam: number;
    /** The streamline stroke drawn in this cell (0 when no dash passes), and which level it is. */
    line: number;
    lineLevel: number;
    /** Ink of surface specks in this cell. */
    speck: number;
    /** 1 at the waterline, falling to 0 in the middle of the channel. */
    shallow: number;
    /** -1 at the left bank, 0 mid-channel, 1 at the right bank. */
    across: number;
    /** Screen y in pixels, for the standing waves that stay put while the water runs through them. */
    y: number;
    time: number;
    hash: number;
    dark: boolean;
};

export type GlyphChoice = { code: number; bucket: number };

const char = (glyph: string) => glyph.charCodeAt(0);
const CREST = char("~"), HOTTEST = char("*");
const SPECK_GLYPHS = [char("."), char("."), char("'"), char(","), char("`"), char(".")];
const WHITEWATER_DAY = [char("o"), char("."), char("°"), char("."), char("o"), char(":")];
const WHITEWATER_NIGHT = [char("o"), char("*"), char("°"), char("O"), char("o"), char(".")];

const BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

/** Ordered-dither threshold for a character cell: neighbouring cells take different thresholds. */
export const bayerThreshold = (i: number, j: number) => BAYER[(j & 7) * 8 + (i & 7)];

/** Like a survey map, every fifth streamline is an index line drawn heavier than the rest. */
const INDEX_EVERY = 5;
const lineBucket = (level: number) => (level % INDEX_EVERY === 0 ? BUCKET_STRONG : BUCKET_SOFT);

const STANDING_WAVE_PX = 26;
const CREST_BOW_PX = 22;

/**
 * Crests of the standing waves in the fast water: they stay put while the water runs through
 * them, bowed downstream in the middle where the current is fastest.
 */
function crest(s: WaterSample, speed: number) {
    const fast = Math.min(1, Math.max(0, speed - 1.9) * 1.2);
    if (fast === 0) return 0;
    const phase = ((s.y - CREST_BOW_PX * (1 - s.across * s.across)) / STANDING_WAVE_PX) * Math.PI * 2;
    return fast * Math.max(0, Math.sin(phase)) ** 6;
}

const WHITEWATER = 0.45;

/** Whitewater: by day mostly paper with bubbles drawn in, by night a bright froth. */
function whitewater(s: WaterSample, dither: number, out: GlyphChoice) {
    const froth = Math.min(1, (s.foam - WHITEWATER) / (1 - WHITEWATER));
    const present = dither < (s.dark ? 0.4 + froth * 0.55 : 0.3 + froth * 0.4);
    out.bucket = present ? (froth > 0.55 ? BUCKET_MID : BUCKET_SOFT) : HIDDEN;
    const glyphs = s.dark ? WHITEWATER_NIGHT : WHITEWATER_DAY;
    out.code = glyphs[Math.floor(s.hash * 6 + froth * 3) % 6];
    if (present && s.foam > 0.95 && s.hash > 0.975) { out.bucket = BUCKET_RED; out.code = HOTTEST; }
}

const EDDY_SPIN = 0.32;

/** The surface between the lines: specks drifting with the water, a shade darker where they bunch up. */
function surface(s: WaterSample, out: GlyphChoice) {
    out.bucket = s.speck > 1.5 ? BUCKET_MID : BUCKET_SOFT;
    out.code = SPECK_GLYPHS[Math.floor(s.hash * 6)];
}

const SPECK_INK = 0.3;
const EDDY_STIPPLE = [char("."), char(":"), char("·"), char(".")];

/** An eddy's core stippled by how fast it spins, the way a vorticity plot shades it. */
function eddyStipple(s: WaterSample, dither: number, out: GlyphChoice) {
    const strength = Math.abs(s.spin) - EDDY_SPIN;
    if (strength <= 0 || dither > strength * 1.1) return false;
    out.code = EDDY_STIPPLE[Math.floor(s.hash * 4)];
    out.bucket = strength > 0.5 ? BUCKET_MID : BUCKET_SOFT;
    return true;
}

/** `dither` is the cell's ordered-dither threshold in 0..1. */
export function chooseWaterGlyph(s: WaterSample, dither: number, out: GlyphChoice) {
    if (s.foam > WHITEWATER) return whitewater(s, dither, out);
    const speed = Math.hypot(s.vx, s.vy);
    if (crest(s, speed) > dither * 0.8 + 0.15) {
        out.code = CREST;
        out.bucket = BUCKET_MID;
        return;
    }
    if (s.line) {
        out.code = s.line;
        out.bucket = lineBucket(s.lineLevel);
        return;
    }
    if (eddyStipple(s, dither, out)) return;
    if (s.speck > SPECK_INK) return surface(s, out);
    out.bucket = HIDDEN;
}
