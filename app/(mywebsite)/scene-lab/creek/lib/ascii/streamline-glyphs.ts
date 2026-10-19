/**
 * Draws streamlines (contours of the normalized stream function) into character cells by marching
 * squares: a cell whose corners straddle a contour level gets the stroke that matches the
 * contour's direction there, sitting high, middle or low in the cell for level lines. Each
 * streamline is broken into dashes at fixed travel times, so the dashes move with the water.
 */
export type CellCorners = { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };

export type StreamlineStyle = { levels: number; dashesPerSecond: number; duty: number };

const char = (glyph: string) => glyph.charCodeAt(0);
const VERTICAL = char("|"), FALLING = char("\\"), RISING = char("/");
const LEVEL = char("-"), LEVEL_HIGH = char("¯"), LEVEL_LOW = char("_");

const STEEP = 1.18;
const SHALLOW = 0.39;

/** Index of the single contour level crossing the cell, or -1 (none, or the corners are flat). */
function crossingLevel(c: CellCorners, levels: number) {
    const low = Math.min(c.topLeft, c.topRight, c.bottomRight, c.bottomLeft);
    const high = Math.max(c.topLeft, c.topRight, c.bottomRight, c.bottomLeft);
    const n = Math.ceil(low * levels);
    if (n <= 0 || n >= levels || n / levels >= high) return -1;
    return n;
}

const fraction = (from: number, to: number, level: number) => (to === from ? 0.5 : Math.min(1, Math.max(0, (level - from) / (to - from))));

function levelGlyph(c: CellCorners, level: number) {
    const rise = 0.5 * (fraction(c.topLeft, c.bottomLeft, level) + fraction(c.topRight, c.bottomRight, level));
    if (rise < 0.3) return LEVEL_HIGH;
    return rise > 0.7 ? LEVEL_LOW : LEVEL;
}

/** The contour's angle (from +x, y down, folded to -π/2..π/2) is perpendicular to the gradient of ψ. */
function contourAngle(c: CellCorners, cellW: number, cellH: number) {
    const gx = (c.topRight - c.topLeft + c.bottomRight - c.bottomLeft) / (2 * cellW);
    const gy = (c.bottomLeft - c.topLeft + c.bottomRight - c.topRight) / (2 * cellH);
    return Math.atan(-gx / (gy || 1e-9));
}

function contourGlyph(c: CellCorners, angle: number, level: number) {
    const a = Math.abs(angle);
    if (a > STEEP) return VERTICAL;
    if (a < SHALLOW) return levelGlyph(c, level);
    return angle > 0 ? FALLING : RISING;
}

const within = (from: number, to: number, level: number) => {
    const t = (level - from) / (to - from);
    return t >= 0 && t < 1;
};

/**
 * Keeps a line one cell wide: a contour also clips the corners of the cells beside it, so a cell
 * only draws it if the contour crosses the cell's midline along its main direction (the
 * horizontal midline for a steep line, the vertical midline for a flat one).
 */
function ownsLine(c: CellCorners, angle: number, level: number) {
    if (Math.abs(angle) > Math.PI / 4) return within((c.topLeft + c.bottomLeft) / 2, (c.topRight + c.bottomRight) / 2, level);
    return within((c.topLeft + c.topRight) / 2, (c.bottomLeft + c.bottomRight) / 2, level);
}

export type StreamlineMark = { code: number; level: number };

/** Fills `out` and returns true when a dash of a streamline passes through the cell. */
export function streamlineMark(c: CellCorners, travel: number, time: number, style: StreamlineStyle, cell: { w: number; h: number }, out: StreamlineMark) {
    const n = crossingLevel(c, style.levels);
    if (n < 0) return false;
    const phase = (travel - time) * style.dashesPerSecond + n * 0.618;
    if (phase - Math.floor(phase) > style.duty) return false;
    const level = n / style.levels;
    const angle = contourAngle(c, cell.w, cell.h);
    if (!ownsLine(c, angle, level)) return false;
    out.level = n;
    out.code = contourGlyph(c, angle, level);
    return true;
}
