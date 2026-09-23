import { pairedMasks } from "./kit/paired-masks";
import { wrapTime } from "./kit/easing";
import { prefersStillFigure } from "./lib/motion";
import { drawFieldEdge, drawRobot, drawRoute, drawShotPulse, drawTileSeams, drawWaypoints } from "./heron/field-ink";
import { createHeronScene, fitScene, placeRobotPixels, sampleHeron } from "./heron/scene";
import { drawStepList } from "./heron/step-list";
import { LOOP_SECONDS, advanceRobot } from "./heron/timeline";
import type { FigureSpec } from "./types";

const CELL = 8;
const STILL_MOMENT = 9.4;

export const heronFigure: FigureSpec = {
    cell: CELL,
    createInstance: () => {
        const scene = createHeronScene();
        const offset = prefersStillFigure() ? STILL_MOMENT : 0;
        const { mask, brightness } = pairedMasks((x, y, out) => sampleHeron(scene, x, y, out));
        return {
            mask,
            brightness,
            beforeFrame: (w, h, t) => {
                fitScene(scene, w, h, CELL);
                advanceRobot(scene.robot, wrapTime(t + offset, LOOP_SECONDS));
                placeRobotPixels(scene);
            },
            overlay: (ctx, _w, _h, _t, colors) => {
                const layout = scene.layout;
                if (!layout) return;
                drawTileSeams(ctx, layout, scene.pixels, colors);
                drawFieldEdge(ctx, layout, colors);
                drawRoute(ctx, layout, scene.robot.lit, scene.robot.trailStrength, colors);
                drawWaypoints(ctx, layout, colors);
                drawRobot(ctx, scene.pixels, scene.robot.alpha, colors);
                drawShotPulse(ctx, scene.pixels, scene.robot.pulse, colors);
                if (layout.wide) drawStepList(ctx, layout, scene.robot, colors);
                ctx.globalAlpha = 1;
            },
        };
    },
};
