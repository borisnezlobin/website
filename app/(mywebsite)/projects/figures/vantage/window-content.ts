import type { FacetSample } from "../kit/paired-masks";
import { TITLE_BAR_METRES, type RoomWindow } from "./room-windows";

export const TEXT_LINE_METRES = 0.11;
export const LIST_ROW_METRES = 0.2;
export const SIDEBAR_FRACTION = 0.27;
const PANE_DENSITY = 0.32;
const PANE_BRIGHTNESS = 1.1;
const INK_DENSITY = 0.92;

const paint = (out: FacetSample, density: number, brightness: number) => {
    out.density = density;
    out.brightness = brightness;
};

const textLines = (u: number, depth: number, out: FacetSample) => {
    const line = Math.floor(depth / TEXT_LINE_METRES);
    const inside = depth / TEXT_LINE_METRES - line < 0.55;
    const end = 0.93 - ((line * 37) % 5) * 0.09;
    if (inside && u > 0.34 && u < end) paint(out, INK_DENSITY, 2.2);
    else paint(out, PANE_DENSITY, PANE_BRIGHTNESS);
};

const sidebar = (u: number, depth: number, out: FacetSample) => {
    if (u < SIDEBAR_FRACTION) { paint(out, 0.8, 1.8); return; }
    textLines(u, depth, out);
};

const listRows = (u: number, depth: number, out: FacetSample) => {
    const row = depth / LIST_ROW_METRES;
    const card = row - Math.floor(row) < 0.68 && u > 0.08 && u < 0.92;
    if (card) paint(out, 0.85, 2);
    else paint(out, PANE_DENSITY, PANE_BRIGHTNESS);
};

const CONTENT = {
    sidebar,
    list: listRows,
    plain: (_u: number, _depth: number, out: FacetSample) => paint(out, 0.72, 1.9),
};

export const windowTexture = (spec: RoomWindow, u: number, v: number, out: FacetSample) => {
    const depth = v * spec.height - TITLE_BAR_METRES;
    if (depth < 0) { paint(out, 1, 3.6); return; }
    CONTENT[spec.content](u, depth, out);
};
