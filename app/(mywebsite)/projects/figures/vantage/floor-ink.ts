import type { SpinColors } from "@/app/lib/spin-drive";
import { project, type HeadCamera } from "./head-camera";
import { GRID_METRES, ROOM_DEPTH, ROOM_HALF_WIDTH, floorFade } from "./floor-grid";

const a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
const NEAREST_Z = 1.2;

const floorSegment = (ctx: CanvasRenderingContext2D, camera: HeadCamera, x0: number, z0: number, x1: number, z1: number) => {
    project(camera, { x: x0, y: 0, z: z0 }, a);
    project(camera, { x: x1, y: 0, z: z1 }, b);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
};

export const drawFloorLines = (ctx: CanvasRenderingContext2D, camera: HeadCamera, colors: SpinColors) => {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    for (let z = GRID_METRES * 2; z <= ROOM_DEPTH; z += GRID_METRES) {
        ctx.globalAlpha = 0.3 * floorFade(z);
        floorSegment(ctx, camera, -ROOM_HALF_WIDTH, z, ROOM_HALF_WIDTH, z);
    }
    for (let x = -ROOM_HALF_WIDTH; x <= ROOM_HALF_WIDTH + 1e-6; x += GRID_METRES) {
        for (let z = NEAREST_Z; z < ROOM_DEPTH; z += GRID_METRES) {
            ctx.globalAlpha = 0.3 * floorFade(z + GRID_METRES / 2);
            floorSegment(ctx, camera, x, z, x, Math.min(ROOM_DEPTH, z + GRID_METRES));
        }
    }
};
