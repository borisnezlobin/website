import { isWideFigure } from "../lib/frame-layout";
import { BIDDERS, SEATS, type RoundSeat } from "./demo-round";

export type ChartLayout = {
    w: number;
    h: number;
    wide: boolean;
    seats: RoundSeat[];
    left: number;
    pitch: number;
    columnHalf: number;
    baseline: number;
    fullHeight: number;
    stubHeight: number;
};

export const chartLayout = (w: number, h: number, cell: number): ChartLayout => {
    const wide = isWideFigure(w);
    const seats = wide ? SEATS : BIDDERS;
    const left = w * 0.1;
    const pitch = (w * 0.8) / seats.length;
    const baseline = Math.round(h * (wide ? 0.8 : 0.86));
    const top = h * (wide ? 0.12 : 0.15);
    return {
        w, h, wide, seats, left, pitch,
        columnHalf: Math.min(pitch * 0.29, 22),
        baseline,
        fullHeight: baseline - top,
        stubHeight: Math.max(cell * 2.5, Math.round(h * 0.07)),
    };
};

export const columnCentre = (layout: ChartLayout, index: number) => layout.left + (index + 0.5) * layout.pitch;

export const columnHeight = (layout: ChartLayout, score: number, opened: number) =>
    layout.stubHeight + (score * layout.fullHeight - layout.stubHeight) * opened;
