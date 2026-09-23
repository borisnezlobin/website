import type { SpinColors } from "@/app/lib/spin-drive";
import { fieldToCanvasX, fieldToCanvasY, type HeronLayout } from "./field-layout";
import { PIECES, TILES_PER_SIDE, WAYPOINTS, pointAlong, type RoutePiece } from "./autonomous-path";
import type { RobotPixels } from "./scene";

const traceRobot = (ctx: CanvasRenderingContext2D, p: RobotPixels) => {
    const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    corners.forEach(([f, s], k) => {
        const x = p.x + (f * p.cos - s * p.sin) * p.half;
        const y = p.y + (f * p.sin + s * p.cos) * p.half;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
};

const robotPath = (ctx: CanvasRenderingContext2D, p: RobotPixels) => {
    ctx.beginPath();
    traceRobot(ctx, p);
};

type Gap = { from: number; to: number };

const seamSegment = (ctx: CanvasRenderingContext2D, vertical: boolean, fixed: number, start: number, end: number) => {
    if (end <= start) return;
    if (vertical) { ctx.moveTo(fixed, start); ctx.lineTo(fixed, end); return; }
    ctx.moveTo(start, fixed);
    ctx.lineTo(end, fixed);
};

const seamAround = (ctx: CanvasRenderingContext2D, vertical: boolean, fixed: number, span: Gap, crossing: Gap, gap: Gap) => {
    const blocked = fixed > crossing.from && fixed < crossing.to;
    if (!blocked) { seamSegment(ctx, vertical, fixed, span.from, span.to); return; }
    seamSegment(ctx, vertical, fixed, span.from, Math.min(span.to, gap.from));
    seamSegment(ctx, vertical, fixed, Math.max(span.from, gap.to), span.to);
};

export const drawTileSeams = (ctx: CanvasRenderingContext2D, layout: HeronLayout, robot: RobotPixels, colors: SpinColors) => {
    const tile = layout.size / TILES_PER_SIDE;
    const reach = robot.half * (Math.abs(robot.cos) + Math.abs(robot.sin)) + 1;
    const acrossX = { from: robot.x - reach, to: robot.x + reach }, acrossY = { from: robot.y - reach, to: robot.y + reach };
    const spanX = { from: layout.left, to: layout.left + layout.size }, spanY = { from: layout.top, to: layout.top + layout.size };
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < TILES_PER_SIDE; k++) {
        const offset = Math.round(k * tile) + 0.5;
        seamAround(ctx, true, layout.left + offset, spanY, acrossX, acrossY);
        seamAround(ctx, false, layout.top + offset, spanX, acrossY, acrossX);
    }
    ctx.stroke();
};

export const drawFieldEdge = (ctx: CanvasRenderingContext2D, layout: HeronLayout, colors: SpinColors) => {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(layout.left + 0.5, layout.top + 0.5, layout.size - 1, layout.size - 1);
};

const tracePiece = (ctx: CanvasRenderingContext2D, layout: HeronLayout, piece: RoutePiece, upTo: number) => {
    const steps = Math.max(2, Math.ceil(piece.points.length * upTo));
    for (let k = 0; k <= steps; k++) {
        const [fx, fy] = pointAlong(piece, (k / steps) * upTo);
        const x = fieldToCanvasX(layout, fx), y = fieldToCanvasY(layout, fy);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
};

export const drawRoute = (ctx: CanvasRenderingContext2D, layout: HeronLayout, lit: Float32Array, trail: number, colors: SpinColors) => {
    ctx.lineWidth = 1.25;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    PIECES.forEach((piece) => tracePiece(ctx, layout, piece, 1));
    ctx.stroke();
    ctx.strokeStyle = colors.glow;
    ctx.globalAlpha = 0.8 * trail;
    ctx.beginPath();
    PIECES.forEach((piece, index) => { if (lit[index] > 0) tracePiece(ctx, layout, piece, lit[index]); });
    ctx.stroke();
};

export const drawWaypoints = (ctx: CanvasRenderingContext2D, layout: HeronLayout, colors: SpinColors) => {
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.7;
    const radius = layout.wide ? 2.5 : 2;
    WAYPOINTS.forEach(([fx, fy]) => {
        ctx.beginPath();
        ctx.arc(fieldToCanvasX(layout, fx), fieldToCanvasY(layout, fy), radius, 0, Math.PI * 2);
        ctx.fill();
    });
};

export const drawRobot = (ctx: CanvasRenderingContext2D, p: RobotPixels, alpha: number, colors: SpinColors) => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "miter";
    robotPath(ctx, p);
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + p.cos * p.half * 0.2, p.y + p.sin * p.half * 0.2);
    ctx.lineTo(p.x + p.cos * p.half * 1.35, p.y + p.sin * p.half * 1.35);
    ctx.stroke();
};

export const drawShotPulse = (ctx: CanvasRenderingContext2D, p: RobotPixels, pulse: number, colors: SpinColors) => {
    if (pulse < 0) return;
    const eased = 1 - (1 - pulse) ** 2;
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, pulse * 1.15)) * 0.9;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.half * (1.25 + eased * 1.1), 0, Math.PI * 2);
    ctx.stroke();
};

