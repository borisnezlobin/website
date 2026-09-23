export const PAGE = {
    widthPt: 612,
    heightPt: 792,
    marginX: 28.35,
    marginY: 21.26,
    nameSize: 22,
};

export type Typography = { fontSize: number; spacing: number };

export const FILL_MIN = 0.92;
export const FILL_MAX = 1.0;
export const SPACING_RANGE: [number, number] = [0.85, 1.15];
export const SPACING_STEP = 0.05;
export const MINIMUM_BULLETS = 6;

const FONT_SIZES = [11, 10.5, 10];
const SPACINGS = [1.0, 0.95, 0.9, 0.85];

/** The smallest type and tightest spacing still worth reading; content is fitted here before it is made nicer. */
export const FLOOR: Typography = { fontSize: FONT_SIZES[FONT_SIZES.length - 1], spacing: SPACING_RANGE[0] };

/** Largest type first, loosest spacing first: the first of these that fits is the nicest page. */
export const TYPOGRAPHY_PREFERENCE: Typography[] = FONT_SIZES.flatMap((fontSize) =>
    SPACINGS.map((spacing) => ({ fontSize, spacing })),
);

export function usablePageHeight(): number {
    return PAGE.heightPt - 2 * PAGE.marginY;
}
