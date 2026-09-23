import { pairedMasks } from "./kit/paired-masks";
import { wrapTime } from "./kit/easing";
import { prefersStillFigure } from "./lib/motion";
import { drawChartInk } from "./arbor/chart-ink";
import { ROUND_SECONDS } from "./arbor/round-clock";
import { advanceRound, createRoundScene, sampleRound } from "./arbor/round-scene";
import type { FigureSpec } from "./types";

const CELL = 8;
const STILL_MOMENT = 5.8;

export const arborFigure: FigureSpec = {
    cell: CELL,
    createInstance: () => {
        const scene = createRoundScene();
        const offset = prefersStillFigure() ? STILL_MOMENT : 0;
        const { mask, brightness } = pairedMasks((x, y, out) => sampleRound(scene, x, y, out));
        return {
            mask,
            brightness,
            beforeFrame: (w, h, t) => advanceRound(scene, w, h, CELL, wrapTime(t + offset, ROUND_SECONDS)),
            overlay: (ctx, _w, _h, _t, colors) => drawChartInk(ctx, scene, colors),
        };
    },
};
