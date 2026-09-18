import type { WhaleBehaviorPath, WhaleStyleCatalog } from "./whale-catalog";
import { planCrossing, type WhaleCrossing } from "./whale-crossing";

type ClimbInput = {
    catalog: WhaleStyleCatalog;
    laneWidth: number;
    laneHeight: number;
    frameWidth: number;
    rising?: boolean;
    mirrored?: boolean;
};

const ENTER_AT = 0.94;
const LEAVE_AT = -0.05;

const climbOf = (path: WhaleBehaviorPath) => path.cycle[1] - path.steps[0][1];

const clipCount = (wanted: number) => (Number.isFinite(wanted) ? Math.max(1, Math.round(wanted)) : 1);

function climbSchedule(paths: WhaleStyleCatalog["behaviors"], rising: boolean, wantedClimb: number) {
    const way = rising ? "rise" : "dive";
    const opening = paths[`${way}_in`], holding = paths[`${way}_hold`], leaving = paths[`${way}_out`];
    if (opening && holding && leaving) {
        const holds = clipCount((wantedClimb - climbOf(opening) - climbOf(leaving)) / climbOf(holding));
        return [`${way}_in`, ...new Array<string>(holds).fill(`${way}_hold`), `${way}_out`];
    }
    const whole = paths[way] ?? paths[Object.keys(paths)[0]];
    const count = clipCount(wantedClimb / (climbOf(whole) || wantedClimb));
    return new Array<string>(count).fill(way);
}

export function planClimb({ catalog, laneWidth, laneHeight, frameWidth, rising, mirrored }: ClimbInput): WhaleCrossing {
    const paths = catalog.behaviors;
    const goesUp = rising ?? mirrored ?? catalog.mirrored;
    const body = frameWidth * paths[Object.keys(paths)[0]].bodyFraction;
    const wantedClimb = ((ENTER_AT - LEAVE_AT) * laneHeight / body) * (goesUp ? -1 : 1);
    const startHeight = ((ENTER_AT - 0.5) * laneHeight / body) * (goesUp ? 1 : -1);

    return planCrossing({
        catalog,
        laneWidth,
        frameWidth,
        mirrored,
        schedule: climbSchedule(paths, goesUp, wantedClimb),
        startHeight,
    });
}
