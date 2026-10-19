import { banksAt } from "../creek-layout";
import { contactAt, measureClearance, type Clearance, type Contact } from "../clearance";
import type { FlowGrid } from "../flow-grid";
import { sampleField, type LatticeFlow } from "../lattice-flow";
import { CODE_LINES, styleLine } from "./code-corpus";

/**
 * Lines of code poured into the top of the creek, one character per particle. Every character
 * is carried by the water on its own, so a line bends round a rock, stretches in fast water and
 * tumbles in an eddy; a weak spring pulls each character back to its place in its line, stronger
 * in calm water, so lines re-form once the water settles downstream. Positions are CSS pixels.
 */
export type TextLine = {
    codes: Uint16Array;
    styles: Uint8Array;
    x: Float32Array;
    y: Float32Array;
    alive: Uint8Array;
    count: number;
    angle: number;
    age: number;
};

export type TextRiver = {
    lines: TextLine[];
    spacing: number;
    lineGap: number;
    step: (steps: number, delta: number) => void;
};

export type RiverMetrics = { width: number; height: number; charW: number; lineH: number };

const SPRING = 2.6;
const CALM_SPIN = 0.7;
const ANGLE_RELAX = 0.25;
const EDGE_MARGIN_PX = 14;
const STONE_MARGIN_PX = 3;
const ESCAPE_PX = 12;
const MAX_POUR = 3;
/** A line caught in an eddy dissolves after this long, so trapped text never piles into a knot. */
export const LINE_LIFE = 24;
export const LINE_FADE = 3;

type Context = { grid: FlowGrid; flow: LatticeFlow; clearance: Clearance; metrics: RiverMetrics; stepsPerSecond: number };

function createLine(text: string, start: number, room: number, ctx: Context): TextLine {
    const { metrics } = ctx;
    const body = text.trim().slice(0, Math.max(0, room));
    const count = body.length;
    const line: TextLine = {
        codes: Uint16Array.from(body, (c) => c.charCodeAt(0)), styles: styleLine(body),
        x: new Float32Array(count), y: new Float32Array(count), alive: new Uint8Array(count).fill(1), count, angle: 0, age: 0,
    };
    for (let i = 0; i < count; i++) { line.x[i] = start + (i + 0.5) * metrics.charW; line.y[i] = -metrics.lineH * 0.5; }
    return line;
}

const scratch = { x: 0, y: 0 };

/** Midpoint (RK2) step through the flow, in pixels. */
function carry(ctx: Context, x: number, y: number, steps: number, out: { x: number; y: number }) {
    const { flow, grid } = ctx;
    const { ux, uy, cols, rows } = flow;
    const px = grid.cellPx, half = steps * 0.5;
    const gx = x / px, gy = Math.max(0.5, y / px);
    const mx = gx + sampleField(ux, cols, rows, gx, gy) * half, my = gy + sampleField(uy, cols, rows, gx, gy) * half;
    out.x = x + sampleField(ux, cols, rows, mx, my) * steps * px;
    out.y = y + sampleField(uy, cols, rows, mx, my) * steps * px;
}

const contact: Contact = { distance: 0, nx: 0, ny: 0 };

/** Characters that drift into stone are pushed back out along the shortest way. */
function keepOutOfStone(ctx: Context, line: TextLine, i: number) {
    const px = ctx.grid.cellPx;
    contactAt(ctx.clearance, line.x[i] / px, Math.max(0.5, line.y[i] / px), contact);
    const distance = contact.distance * px;
    if (distance >= STONE_MARGIN_PX) return;
    const push = Math.min(ESCAPE_PX, STONE_MARGIN_PX - distance);
    line.x[i] += contact.nx * push;
    line.y[i] += contact.ny * push;
}

type LineCentre = { x: number; y: number; index: number; spin: number; alive: number };

function measureCentre(ctx: Context, line: TextLine): LineCentre {
    const { flow, grid } = ctx;
    const centre = { x: 0, y: 0, index: 0, spin: 0, alive: 0 };
    for (let i = 0; i < line.count; i++) {
        if (!line.alive[i]) continue;
        centre.x += line.x[i]; centre.y += line.y[i]; centre.index += i; centre.alive++;
        centre.spin += sampleField(flow.curl, flow.cols, flow.rows, line.x[i] / grid.cellPx, Math.max(0.5, line.y[i] / grid.cellPx));
    }
    const n = Math.max(1, centre.alive);
    centre.x /= n; centre.y /= n; centre.index /= n; centre.spin /= n;
    return centre;
}

/** Pulls each character towards its slot in the line, harder where the water is calm. */
function reform(ctx: Context, line: TextLine, centre: LineCentre, delta: number) {
    const { flow, grid, metrics } = ctx;
    const cos = Math.cos(line.angle), sin = Math.sin(line.angle);
    for (let i = 0; i < line.count; i++) {
        if (!line.alive[i]) continue;
        const along = (i - centre.index) * metrics.charW;
        const homeX = centre.x + along * cos, homeY = centre.y + along * sin;
        const spin = sampleField(flow.curl, flow.cols, flow.rows, line.x[i] / grid.cellPx, Math.max(0.5, line.y[i] / grid.cellPx)) / flow.inflowSpeed;
        const calm = 1 / (1 + (spin / CALM_SPIN) ** 2);
        const pull = 1 - Math.exp(-SPRING * calm * delta);
        line.x[i] += (homeX - line.x[i]) * pull;
        line.y[i] += (homeY - line.y[i]) * pull;
    }
}

function advanceLine(ctx: Context, line: TextLine, steps: number, delta: number) {
    line.age += delta;
    if (line.age > LINE_LIFE) return false;
    const limit = ctx.metrics.height + ctx.metrics.lineH;
    for (let i = 0; i < line.count; i++) {
        if (!line.alive[i]) continue;
        carry(ctx, line.x[i], line.y[i], steps, scratch);
        line.x[i] = scratch.x; line.y[i] = scratch.y;
        keepOutOfStone(ctx, line, i);
        if (line.y[i] > limit) line.alive[i] = 0;
    }
    const centre = measureCentre(ctx, line);
    line.angle += (centre.spin * ctx.stepsPerSecond * 0.5 * delta) - line.angle * ANGLE_RELAX * delta;
    reform(ctx, line, centre, delta);
    return centre.alive > 0;
}

/** The highest character of a row of lines: the next row pours in once this one has cleared the top. */
function topOf(row: TextLine[]) {
    let top = Infinity;
    for (const line of row) {
        for (let i = 0; i < line.count; i++) if (line.alive[i]) top = Math.min(top, line.y[i]);
    }
    return top;
}

const MIN_FRAGMENT = 6;
const randomGap = () => 3 + Math.floor(Math.random() * 9);

/**
 * One row of text across the top of the creek: code lines laid end to end with ragged gaps, like
 * a page of source scrolled into the water, so the whole width carries text.
 */
function pourRow(ctx: Context, nextLine: () => string): TextLine[] {
    const { metrics } = ctx;
    const { left, right } = banksAt(0, metrics.width, metrics.height);
    const end = right - EDGE_MARGIN_PX;
    const row: TextLine[] = [];
    let cursor = left + EDGE_MARGIN_PX + Math.random() * 6 * metrics.charW;
    while ((end - cursor) / metrics.charW >= MIN_FRAGMENT) {
        const line = createLine(nextLine(), cursor, Math.floor((end - cursor) / metrics.charW), ctx);
        if (line.count > 0) row.push(line);
        cursor += (line.count + randomGap()) * metrics.charW;
    }
    return row;
}

export function createTextRiver(grid: FlowGrid, metrics: RiverMetrics, stepsPerSecond: number): TextRiver {
    const ctx: Context = { grid, flow: grid.flow, clearance: measureClearance(grid.flow.solid, grid.cols, grid.rows), metrics, stepsPerSecond };
    const lineGap = metrics.lineH * 1.25;
    let next = Math.floor(Math.random() * CODE_LINES.length);
    const nextLine = () => CODE_LINES[next = (next + 1) % CODE_LINES.length];
    const river: TextRiver = { lines: [], spacing: metrics.charW, lineGap, step: () => { } };
    let lastRow: TextLine[] = [];
    const pour = () => {
        for (let poured = 0; poured < MAX_POUR && topOf(lastRow) > lineGap * 0.5; poured++) {
            lastRow = pourRow(ctx, nextLine);
            river.lines.push(...lastRow);
        }
    };
    river.step = (steps, delta) => {
        if (steps === 0) return;
        river.lines = river.lines.filter((line) => advanceLine(ctx, line, steps, delta));
        pour();
    };
    return river;
}
