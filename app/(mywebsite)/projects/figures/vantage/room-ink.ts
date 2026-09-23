import type { SpinColors } from "@/app/lib/spin-drive";
import { cameraDepth, project, type HeadCamera, type Vec3 } from "./head-camera";
import { TITLE_BAR_METRES, windowPoint, type PlacedWindow } from "./room-windows";
import { LIST_ROW_METRES, SIDEBAR_FRACTION } from "./window-content";

const scratch = { x: 0, y: 0 };
const ANCHOR_RING_METRES = 0.14;
const RING_STEPS = 24;

const lineBetween = (ctx: CanvasRenderingContext2D, camera: HeadCamera, a: Vec3, b: Vec3) => {
    project(camera, a, scratch);
    ctx.moveTo(scratch.x, scratch.y);
    project(camera, b, scratch);
    ctx.lineTo(scratch.x, scratch.y);
};

const drawFrame = (ctx: CanvasRenderingContext2D, placed: PlacedWindow, camera: HeadCamera, colors: SpinColors) => {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    placed.corners.forEach((c, k) => (k === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.closePath();
    ctx.stroke();
    const bar = TITLE_BAR_METRES / placed.spec.height;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    lineBetween(ctx, camera, windowPoint(placed, 0, bar), windowPoint(placed, 1, bar));
    ctx.stroke();
};

const drawDividers = (ctx: CanvasRenderingContext2D, placed: PlacedWindow, camera: HeadCamera, colors: SpinColors) => {
    const { content, height } = placed.spec;
    const bar = TITLE_BAR_METRES / height;
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    if (content === "sidebar") lineBetween(ctx, camera, windowPoint(placed, SIDEBAR_FRACTION, bar), windowPoint(placed, SIDEBAR_FRACTION, 1));
    for (let depth = LIST_ROW_METRES; content === "list" && depth < height - TITLE_BAR_METRES; depth += LIST_ROW_METRES) {
        const v = bar + (depth - LIST_ROW_METRES * 0.16) / height;
        lineBetween(ctx, camera, windowPoint(placed, 0.08, v), windowPoint(placed, 0.92, v));
    }
    ctx.stroke();
};

const drawButtons = (ctx: CanvasRenderingContext2D, placed: PlacedWindow, camera: HeadCamera, colors: SpinColors) => {
    const { width, height } = placed.spec;
    const v = TITLE_BAR_METRES / 2 / height;
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.7;
    for (let k = 0; k < 3; k++) {
        const point = windowPoint(placed, (0.05 + k * 0.045) / width, v);
        const radius = Math.max(1, (camera.focal * 0.013) / cameraDepth(camera, point));
        project(camera, point, scratch);
        ctx.beginPath();
        ctx.arc(scratch.x, scratch.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
};

const drawAnchor = (ctx: CanvasRenderingContext2D, placed: PlacedWindow, camera: HeadCamera, colors: SpinColors) => {
    const foot = windowPoint(placed, 0.5, 1);
    const ground = { x: foot.x, y: 0, z: foot.z };
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    lineBetween(ctx, camera, foot, ground);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let k = 0; k <= RING_STEPS; k++) {
        const a = (k / RING_STEPS) * Math.PI * 2;
        project(camera, { x: ground.x + Math.cos(a) * ANCHOR_RING_METRES, y: 0, z: ground.z + Math.sin(a) * ANCHOR_RING_METRES }, scratch);
        if (k === 0) ctx.moveTo(scratch.x, scratch.y); else ctx.lineTo(scratch.x, scratch.y);
    }
    ctx.stroke();
};

export const drawRoomInk = (ctx: CanvasRenderingContext2D, windows: PlacedWindow[], camera: HeadCamera, colors: SpinColors) => {
    const farToNear = [...windows].sort((a, b) => cameraDepth(camera, b.spec.centre) - cameraDepth(camera, a.spec.centre));
    farToNear.forEach((placed) => {
        drawAnchor(ctx, placed, camera, colors);
        drawFrame(ctx, placed, camera, colors);
        drawDividers(ctx, placed, camera, colors);
        drawButtons(ctx, placed, camera, colors);
    });
    ctx.globalAlpha = 1;
};
