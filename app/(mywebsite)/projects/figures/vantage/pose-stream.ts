import type { SpinColors } from "@/app/lib/spin-drive";
import { isWideFigure } from "../lib/frame-layout";
import { smoothstep } from "../lib/motion";
import { project, type HeadCamera } from "./head-camera";

const DOTS_PER_SECOND = 6;
const TRAVEL_SECONDS = 1.4;
const STREAM_TARGET = { x: 0.15, y: 0, z: 4.6 };
const target = { x: 0, y: 0 };

type StreamPath = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number };

const jitter = (n: number) => {
    const x = Math.sin(n * 91.7) * 43758.5453;
    return x - Math.floor(x);
};

const pointOn = (p: StreamPath, u: number) => {
    const v = 1 - u;
    return { x: v * v * p.x0 + 2 * v * u * p.cx + u * u * p.x1, y: v * v * p.y0 + 2 * v * u * p.cy + u * u * p.y1 };
};

const drawPhone = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, tilt: number, colors: SpinColors) => {
    const width = height * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, width * 0.18);
    ctx.stroke();
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(-width * 0.18, -height * 0.36, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawDots = (ctx: CanvasRenderingContext2D, path: StreamPath, t: number, colors: SpinColors) => {
    const newest = Math.floor(t * DOTS_PER_SECOND);
    const inFlight = Math.ceil(TRAVEL_SECONDS * DOTS_PER_SECOND);
    ctx.fillStyle = colors.glow;
    for (let n = newest - inFlight; n <= newest; n++) {
        const u = (t - n / DOTS_PER_SECOND) / TRAVEL_SECONDS;
        if (u < 0 || u > 1) continue;
        const p = pointOn(path, u);
        ctx.globalAlpha = 0.8 * smoothstep(0, 0.12, u) * (1 - smoothstep(0.75, 1, u));
        ctx.beginPath();
        ctx.arc(p.x + (jitter(n) - 0.5) * 2, p.y + (jitter(n + 7) - 0.5) * 2, 1.4 + jitter(n + 3) * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }
};

export const drawPoseStream = (ctx: CanvasRenderingContext2D, w: number, h: number, camera: HeadCamera, t: number, colors: SpinColors) => {
    const phoneHeight = isWideFigure(w) ? 44 : 32;
    const phoneX = Math.max(w * 0.1, 30), phoneY = h - phoneHeight * 0.9 - 8;
    project(camera, STREAM_TARGET, target);
    const path: StreamPath = {
        x0: phoneX, y0: phoneY - phoneHeight * 0.62,
        cx: phoneX + (target.x - phoneX) * 0.1, cy: target.y + (phoneY - target.y) * 0.15,
        x1: target.x, y1: target.y,
    };
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(path.x0, path.y0);
    ctx.quadraticCurveTo(path.cx, path.cy, path.x1, path.y1);
    ctx.stroke();
    drawDots(ctx, path, t, colors);
    drawPhone(ctx, phoneX, phoneY, phoneHeight, -camera.yaw * 1.5, colors);
    ctx.globalAlpha = 1;
};
