import { hourSampleAt } from "./series";
import { mhzToY, sampleIndexAtX, type EnfLayout } from "./geometry";

const SURFACE_DENSITY = 0.03;
const SURFACE_BRIGHTNESS = 0.4;
const HALO_DENSITY = 0.16;

export type EnfField = {
    layout: EnfLayout;
    cell: number;
    traceY: Float32Array;
    envelope: number;
};

export const createEnfField = (layout: EnfLayout, cell: number): EnfField =>
    ({ layout, cell, traceY: new Float32Array(Math.ceil(layout.w / cell) + 1), envelope: 1 });

export const sampleTrace = (field: EnfField, head: number) => {
    const { layout, cell, traceY } = field;
    for (let column = 0; column < traceY.length; column++) {
        const x = Math.min(layout.right, Math.max(layout.left, (column + 0.5) * cell));
        traceY[column] = mhzToY(layout, hourSampleAt(sampleIndexAtX(layout, head, x)));
    }
};

const insidePlot = (layout: EnfLayout, cx: number) => cx >= layout.left && cx <= layout.right;

const reachAt = (field: EnfField, cx: number) => field.traceY[Math.floor(cx / field.cell)] - field.layout.baseline;

export const enfDensity = (field: EnfField, cx: number, cy: number) => {
    if (!insidePlot(field.layout, cx)) return SURFACE_DENSITY;
    const reach = reachAt(field, cx);
    const share = (cy - field.layout.baseline) / reach;
    if (share >= 0 && share <= 1) return 0.2 + 0.8 * share ** 1.4;
    if (share > 1 && (share - 1) * Math.abs(reach) < field.cell) return HALO_DENSITY;
    return SURFACE_DENSITY;
};

export const enfBrightness = (field: EnfField, cx: number, cy: number) => {
    if (!insidePlot(field.layout, cx)) return SURFACE_BRIGHTNESS * field.envelope;
    const share = (cy - field.layout.baseline) / reachAt(field, cx);
    if (!(share >= 0 && share <= 1.2)) return SURFACE_BRIGHTNESS * field.envelope;
    const age = (cx - field.layout.left) / (field.layout.right - field.layout.left);
    return (1.2 + 3.4 * age ** 1.3) * field.envelope;
};
