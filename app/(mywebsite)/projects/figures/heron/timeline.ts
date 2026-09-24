import { easeInOutSine, progressBetween } from "../kit/easing";
import { LEGS, PIECES, START_HEADING, WAYPOINTS, pointAlong, shortestTurn, type Point } from "./autonomous-path";

type PhaseKind = "hold" | "move" | "shoot" | "rest";

type Phase = { kind: PhaseKind; start: number; duration: number; step: number; leg: number };

export const LOOP_SECONDS = 20;
const START_HOLD = 0.9;
const SHOOT_PAUSE = 0.5;
const REST = 1.7;
const FADE_IN = 0.35;
export const FADE_OUT = 0.8;
const LEG_OVERHEAD = 0.3;

const buildPhases = (): Phase[] => {
    const shots = LEGS.filter((leg) => leg.shootAfter).length;
    const travel = LEGS.reduce((sum, leg) => sum + PIECES[leg.piece].total, 0);
    const budget = LOOP_SECONDS - START_HOLD - REST - shots * SHOOT_PAUSE - LEGS.length * LEG_OVERHEAD;
    const secondsPerInch = budget / travel;
    const phases: Phase[] = [{ kind: "hold", start: 0, duration: START_HOLD, step: 0, leg: -1 }];
    let clock = START_HOLD;
    LEGS.forEach((leg, index) => {
        const duration = LEG_OVERHEAD + PIECES[leg.piece].total * secondsPerInch;
        phases.push({ kind: "move", start: clock, duration, step: leg.step, leg: index });
        clock += duration;
        if (!leg.shootAfter) return;
        phases.push({ kind: "shoot", start: clock, duration: SHOOT_PAUSE, step: leg.step, leg: index });
        clock += SHOOT_PAUSE;
    });
    phases.push({ kind: "rest", start: clock, duration: LOOP_SECONDS - clock, step: LEGS[LEGS.length - 1].step, leg: LEGS.length - 1 });
    return phases;
};

const PHASES = buildPhases();

export const STEP_STARTS = PHASES.reduce<number[]>((starts, phase) => {
    if (starts[phase.step] === undefined) starts[phase.step] = phase.start;
    return starts;
}, []);

export type RobotState = {
    x: number;
    y: number;
    heading: number;
    step: number;
    pulse: number;
    alpha: number;
    trailStrength: number;
    lit: Float32Array;
    loopTime: number;
};

export const createRobotState = (): RobotState => ({
    x: WAYPOINTS[0][0], y: WAYPOINTS[0][1], heading: START_HEADING, step: 0,
    pulse: -1, alpha: 1, trailStrength: 1, lit: new Float32Array(PIECES.length), loopTime: 0,
});

const phaseAt = (time: number) => {
    for (let k = PHASES.length - 1; k > 0; k--) if (time >= PHASES[k].start) return PHASES[k];
    return PHASES[0];
};

const place = (state: RobotState, point: Point, heading: number) => {
    state.x = point[0];
    state.y = point[1];
    state.heading = heading;
};

const markTravelled = (state: RobotState, legIndex: number, fraction: number) => {
    state.lit.fill(0);
    for (let k = 0; k < legIndex; k++) state.lit[LEGS[k].piece] = 1;
    if (legIndex < 0) return;
    const piece = LEGS[legIndex].piece;
    state.lit[piece] = Math.max(state.lit[piece], fraction);
};

const poseDuringPhase = (state: RobotState, phase: Phase, progress: number) => {
    if (phase.leg < 0) { place(state, WAYPOINTS[0], START_HEADING); markTravelled(state, -1, 0); return; }
    const leg = LEGS[phase.leg];
    const eased = phase.kind === "move" ? easeInOutSine(progress) : 1;
    const heading = leg.fromHeading + shortestTurn(leg.fromHeading, leg.toHeading) * eased;
    place(state, pointAlong(PIECES[leg.piece], eased), heading);
    markTravelled(state, phase.leg, eased);
};

export const advanceRobot = (state: RobotState, loopTime: number) => {
    const phase = phaseAt(loopTime);
    const progress = progressBetween(phase.start, phase.start + phase.duration, loopTime);
    poseDuringPhase(state, phase, progress);
    state.step = phase.step;
    state.loopTime = loopTime;
    state.pulse = phase.kind === "shoot" ? progress : -1;
    const fadingOut = progressBetween(LOOP_SECONDS - FADE_OUT, LOOP_SECONDS, loopTime);
    state.alpha = Math.min(progressBetween(0, FADE_IN, loopTime), 1 - fadingOut);
    state.trailStrength = 1 - fadingOut;
};
