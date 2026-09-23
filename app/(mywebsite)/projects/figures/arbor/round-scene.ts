import type { FacetSample } from "../kit/paired-masks";
import { chartLayout, columnCentre, columnHeight, type ChartLayout } from "./chart-layout";
import { roundMoment, seatState, type RoundMoment, type SeatState } from "./round-clock";

export type RoundScene = {
    layout: ChartLayout | null;
    states: SeatState[];
    tops: Float32Array;
    moment: RoundMoment;
};

const BACKGROUND_DENSITY = 0.035;
const BACKGROUND_BRIGHTNESS = 0.55;
const COLUMN_DENSITY = 0.95;

export const createRoundScene = (): RoundScene => ({ layout: null, states: [], tops: new Float32Array(0), moment: { reveal: 0, settle: 1 } });

const fitRound = (scene: RoundScene, w: number, h: number, cell: number) => {
    if (scene.layout && scene.layout.w === w && scene.layout.h === h) return;
    scene.layout = chartLayout(w, h, cell);
    scene.states = scene.layout.seats.map(() => ({ opened: 0, score: 0, brightness: 1, arrival: 0 }));
    scene.tops = new Float32Array(scene.layout.seats.length);
};

export const advanceRound = (scene: RoundScene, w: number, h: number, cell: number, time: number) => {
    fitRound(scene, w, h, cell);
    const layout = scene.layout;
    if (!layout) return;
    scene.moment = roundMoment(time);
    layout.seats.forEach((seat, index) => {
        const state = scene.states[index];
        seatState(seat, time, scene.moment, state);
        const height = seat.agent === null ? layout.stubHeight : columnHeight(layout, seat.score, state.opened);
        scene.tops[index] = layout.baseline - height;
    });
};

const columnAt = (layout: ChartLayout, x: number) => {
    const index = Math.floor((x - layout.left) / layout.pitch);
    if (index < 0 || index >= layout.seats.length) return -1;
    return Math.abs(x - columnCentre(layout, index)) <= layout.columnHalf ? index : -1;
};

export const sampleRound = (scene: RoundScene, x: number, y: number, out: FacetSample) => {
    out.density = BACKGROUND_DENSITY;
    out.brightness = BACKGROUND_BRIGHTNESS;
    const layout = scene.layout;
    if (!layout || y > layout.baseline) return;
    const index = columnAt(layout, x);
    if (index < 0 || y < scene.tops[index]) return;
    out.density = COLUMN_DENSITY;
    out.brightness = scene.states[index].brightness;
};
