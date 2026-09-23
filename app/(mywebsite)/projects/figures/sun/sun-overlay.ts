import type { SpinColors } from "@/app/lib/spin-drive";
import { drawLabel } from "../lib/canvas-text";
import { figureInsetX, labelSize } from "../lib/frame-layout";
import type { SunDisk } from "./disk-geometry";
import { surfaceToScreen, type ScreenPoint } from "./projection";
import { driftRate, MAX_LATITUDE, MERIDIAN_LONGITUDES } from "./rotation-model";

const LATITUDE_STEP = 2.5;
const SCALE_LATITUDES = [60, 30, 0, -30, -60];

const drawLimb = (ctx: CanvasRenderingContext2D, disk: SunDisk, colors: SpinColors) => {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(disk.cx, disk.cy, disk.radius, 0, Math.PI * 2);
    ctx.stroke();
};

const traceCurve = (ctx: CanvasRenderingContext2D, disk: SunDisk, steps: number, pointAt: (step: number) => ScreenPoint) => {
    let drawing = false;
    for (let step = 0; step <= steps; step++) {
        const point = pointAt(step);
        if (point.depth < 0) { drawing = false; continue; }
        const x = disk.cx + disk.radius * point.x, y = disk.cy - disk.radius * point.y;
        if (drawing) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        drawing = true;
    }
};

const MERIDIAN_STEPS = (MAX_LATITUDE * 2) / LATITUDE_STEP;

const traceMeridian = (ctx: CanvasRenderingContext2D, disk: SunDisk, meridian: number, days: number) =>
    traceCurve(ctx, disk, MERIDIAN_STEPS, (step) => {
        const latitude = -MAX_LATITUDE + step * LATITUDE_STEP;
        return surfaceToScreen(latitude, meridian + driftRate(latitude) * days);
    });

const drawParallels = (ctx: CanvasRenderingContext2D, disk: SunDisk, colors: SpinColors) => {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.28;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    for (const latitude of SCALE_LATITUDES) traceCurve(ctx, disk, 72, (step) => surfaceToScreen(latitude, step * 5 - 180));
    ctx.stroke();
    ctx.setLineDash([]);
};

const drawMeridians = (ctx: CanvasRenderingContext2D, disk: SunDisk, days: number, colors: SpinColors, weight: number) => {
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = disk.wide ? 1.5 : 1.25;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = weight;
    ctx.beginPath();
    for (const meridian of MERIDIAN_LONGITUDES) traceMeridian(ctx, disk, meridian, days);
    ctx.stroke();
};

const drawLatitudeScale = (ctx: CanvasRenderingContext2D, disk: SunDisk, colors: SpinColors) => {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    const limbPoints = SCALE_LATITUDES.map((latitude) => ({ latitude, ...surfaceToScreen(latitude, 90) }));
    for (const point of limbPoints) {
        const x = disk.cx + disk.radius * point.x, y = disk.cy - disk.radius * point.y;
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 10, y);
    }
    ctx.stroke();
    for (const point of limbPoints.filter((p) => p.latitude >= 0)) {
        drawLabel(ctx, `${point.latitude}°`, disk.cx + disk.radius * point.x + 14, disk.cy - disk.radius * point.y, {
            size: labelSize(disk.w), color: colors.ink, alpha: 0.9, baseline: "middle",
        });
    }
};

const drawDayCounter = (ctx: CanvasRenderingContext2D, disk: SunDisk, days: number, colors: SpinColors) => {
    const label = `Day ${Math.floor(days)}`;
    if (!disk.wide) {
        drawLabel(ctx, label, figureInsetX(disk.w), 14, { size: 14, color: colors.glow, baseline: "top" });
        return;
    }
    const corner = disk.radius * Math.SQRT1_2;
    drawLabel(ctx, label, disk.cx - corner - 12, disk.cy - corner - 12, { size: 18, color: colors.glow, align: "right" });
};

export const drawSunOverlay = (ctx: CanvasRenderingContext2D, disk: SunDisk, days: number, colors: SpinColors, meridianWeight: number) => {
    drawLimb(ctx, disk, colors);
    drawParallels(ctx, disk, colors);
    drawMeridians(ctx, disk, days, colors, meridianWeight);
    if (disk.wide) drawLatitudeScale(ctx, disk, colors);
    drawDayCounter(ctx, disk, days, colors);
    ctx.globalAlpha = 1;
};
