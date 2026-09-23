import type { AmeliaLayout } from "./geometry";
import { laneAt, laneCentre } from "./geometry";
import { LANE_COUNT, type LaneCoverage } from "./timeline";

const SURFACE_DENSITY = 0.03;
const TRACK_DENSITY = 0.08;
const SURFACE_BRIGHTNESS = 0.4;
const HEARD = 5;
const UNHEARD = 0.6;
const AFTERGLOW = 3.5;

export type AmeliaField = {
    layout: AmeliaLayout;
    coverage: LaneCoverage;
    cell: number;
    playheadX: number;
    memory: number;
};

const bandLane = (field: AmeliaField, cy: number) => {
    const lane = laneAt(field.layout, cy);
    if (lane < 0 || lane >= LANE_COUNT) return -1;
    return Math.abs(cy - laneCentre(field.layout, lane)) <= field.layout.halfBand ? lane : -1;
};

export const coverageAt = (field: AmeliaField, lane: number, x: number) => {
    const column = Math.floor(x / field.cell);
    if (column < 0 || column >= field.coverage.columns) return 0;
    return field.coverage.values[lane * field.coverage.columns + column];
};

export const ameliaDensity = (field: AmeliaField, cx: number, cy: number) => {
    const lane = bandLane(field, cy);
    if (lane < 0) return SURFACE_DENSITY;
    const talk = coverageAt(field, lane, cx);
    return talk > 0 ? 0.3 + 0.6 * Math.min(1, Math.sqrt(talk) * 1.15) : TRACK_DENSITY;
};

export const ameliaBrightness = (field: AmeliaField, cx: number, cy: number) => {
    if (bandLane(field, cy) < 0) return SURFACE_BRIGHTNESS;
    const behind = field.playheadX - cx;
    if (behind < 0) return UNHEARD;
    const heard = UNHEARD + (HEARD - UNHEARD) * field.memory;
    return heard + AFTERGLOW * field.memory * Math.exp(-behind / (field.layout.w * 0.035));
};
