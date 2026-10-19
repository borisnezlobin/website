import { banksAt } from "../creek-layout";
import type { PrintSize } from "./print-sizes";

/**
 * Where the prints rest under reduced motion: washed up along both banks, alternating sides,
 * in one or two staggered columns depending on how much shore there is.
 */
export type RestingPlace = { x: number; y: number; angle: number };

const GAP = 14;
const EDGE = 8;

const tilt = (index: number) => Math.sin(index * 12.9898) * 0.11;

function columnsFor(room: number, longSide: number) {
    return room > longSide * 2 + GAP * 3 ? 2 : 1;
}

export type ShoreLayout = { columns: number; rows: number; longSide: number };

/** How the prints stack along each bank, shrinking them if one column would run off the screen. */
export function shoreLayout(count: number, width: number, height: number, preferredLongSide: number): ShoreLayout {
    const perSide = Math.ceil(count / 2);
    const middle = banksAt(0.5, width, height);
    const columns = columnsFor(Math.min(middle.left, width - middle.right), preferredLongSide);
    const rows = Math.ceil(perSide / columns);
    const fits = (height - GAP) / (rows + (columns > 1 ? 0.5 : 0)) - GAP;
    return { columns, rows, longSide: Math.min(preferredLongSide, fits) };
}

export function restingPlaces(sizes: PrintSize[], width: number, height: number, layout: ShoreLayout): RestingPlace[] {
    const { columns, rows, longSide } = layout;
    return sizes.map((size, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const slot = Math.floor(index / 2);
        const row = Math.floor(slot / columns), column = slot % columns;
        const y = ((row + 0.5 + (column ? 0.5 : 0)) / (rows + (columns > 1 ? 0.5 : 0))) * height;
        const banks = banksAt(y / height, width, height);
        const shore = side < 0 ? banks.left : banks.right;
        const outward = GAP + size.width / 2 + column * (longSide + GAP);
        const x = Math.max(size.width / 2 + EDGE, Math.min(width - size.width / 2 - EDGE, shore + side * outward));
        return { x, y, angle: tilt(index) };
    });
}
