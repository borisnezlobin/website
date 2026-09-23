import { pairedMasks } from "./kit/paired-masks";
import { prefersStillFigure } from "./lib/motion";
import { drawFloorLines } from "./vantage/floor-ink";
import { drawPoseStream } from "./vantage/pose-stream";
import { drawRoomInk } from "./vantage/room-ink";
import { advanceRoom, createRoomScene, sampleRoom } from "./vantage/room-scene";
import type { FigureSpec } from "./types";

const CELL = 9;
const STILL_MOMENT = 1.6;

export const vantageFigure: FigureSpec = {
    cell: CELL,
    createInstance: () => {
        const scene = createRoomScene(CELL);
        const offset = prefersStillFigure() ? STILL_MOMENT : 0;
        let clock = 0;
        const { mask, brightness } = pairedMasks((x, y, out) => sampleRoom(scene, x, y, out));
        return {
            mask,
            brightness,
            beforeFrame: (w, h, t) => {
                clock = t + offset;
                advanceRoom(scene, w, h, clock);
            },
            overlay: (ctx, w, h, _t, colors) => {
                drawFloorLines(ctx, scene.camera, colors);
                drawRoomInk(ctx, scene.windows, scene.camera, colors);
                drawPoseStream(ctx, w, h, scene.camera, clock, colors);
            },
        };
    },
};
