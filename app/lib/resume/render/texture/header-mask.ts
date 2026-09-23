import { PAGE } from "../typesetting";
import type { Mask } from "./spin-facets";

export const TEXTURE_HEIGHT_PT = 72;

type Box = { left: number; top: number; right: number; bottom: number };

/** Where the header text sits on the page, in pt, measured from the rendered PDF with generous room. */
const CENTRE_X = PAGE.widthPt / 2;
const NAME_BOX: Box = { left: CENTRE_X - 90, top: 18, right: CENTRE_X + 90, bottom: 42 };
const CONTACTS_BOX: Box = { left: CENTRE_X - 225, top: 40, right: CENTRE_X + 225, bottom: 55 };
const BODY_BOX: Box = { left: PAGE.marginX, top: 55, right: PAGE.widthPt - PAGE.marginX, bottom: Infinity };
const KEEP_OUT = [NAME_BOX, CONTACTS_BOX, BODY_BOX];

/** Facets thin out over this distance from any text box instead of stopping at a hard edge. */
const CLEARANCE_FADE_PT = 9;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function distanceToBox(x: number, y: number, box: Box): number {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    return Math.hypot(dx, dy);
}

function clearance(x: number, y: number): number {
    const nearest = Math.min(...KEEP_OUT.map((box) => distanceToBox(x, y, box)));
    return clamp01(nearest / CLEARANCE_FADE_PT);
}

/** The article canopy, reshaped for a page: shallow over the name, deeper toward both edges. */
function canopy(x: number, y: number): number {
    const u = x / PAGE.widthPt;
    const wobble = Math.sin(x * 0.036 + 0.6) * 2.2 + Math.sin(x * 0.104) * 1.4;
    const boundary = 16 + 44 * (2 * u - 1) ** 2 + wobble;
    return clamp01((boundary - y) / 14);
}

export function headerCanopyMask(pxPerPt: number): Mask {
    return (px, py) => {
        const x = px / pxPerPt, y = py / pxPerPt;
        return canopy(x, y) * clearance(x, y);
    };
}
