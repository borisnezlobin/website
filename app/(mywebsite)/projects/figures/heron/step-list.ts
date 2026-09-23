import type { SpinColors } from "@/app/lib/spin-drive";
import { drawLabel } from "../lib/canvas-text";
import { easeInOutSine, lerp, progressBetween } from "../kit/easing";
import { LIST_FONT_PX, type HeronLayout } from "./field-layout";
import { STEP_NAMES } from "./autonomous-path";
import { STEP_STARTS, type RobotState } from "./timeline";

const HANDOFF_SECONDS = 0.3;
const DONE_ALPHA = 0.62;
const UPCOMING_ALPHA = 0.34;
const MARK_WIDTH = 10;

const restingAlpha = (row: number, step: number) => (row < step ? DONE_ALPHA : UPCOMING_ALPHA);

const rowAlpha = (row: number, robot: RobotState, handoff: number) => {
    if (row === robot.step) return lerp(UPCOMING_ALPHA, 1, handoff);
    if (row === robot.step - 1) return lerp(1, DONE_ALPHA, handoff);
    return restingAlpha(row, robot.step);
};

export const drawStepList = (ctx: CanvasRenderingContext2D, layout: HeronLayout, robot: RobotState, colors: SpinColors) => {
    const handoff = easeInOutSine(progressBetween(0, HANDOFF_SECONDS, robot.loopTime - STEP_STARTS[robot.step]));
    const settle = robot.trailStrength;
    STEP_NAMES.forEach((name, row) => {
        const alpha = lerp(UPCOMING_ALPHA, rowAlpha(row, robot, handoff), settle);
        const current = row === robot.step;
        drawLabel(ctx, name, layout.listX, layout.listTop + row * layout.rowHeight, {
            size: LIST_FONT_PX, color: current ? colors.glow : colors.ink, alpha, baseline: "middle",
        });
    });
    const fromRow = Math.max(0, robot.step - 1);
    const markY = layout.listTop + lerp(fromRow, robot.step, robot.step === 0 ? 1 : handoff) * layout.rowHeight;
    ctx.globalAlpha = robot.step === 0 ? handoff : settle;
    ctx.fillStyle = colors.red;
    ctx.fillRect(layout.listX - MARK_WIDTH - 8, Math.round(markY) - 1, MARK_WIDTH, 2);
    ctx.globalAlpha = 1;
};
