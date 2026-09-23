import { PAGE } from "../typesetting";
import { headerCanopyMask, TEXTURE_HEIGHT_PT } from "./header-mask";
import { spinFacetsSvg, type SpinColors } from "./spin-facets";

/** Site pixels per printed point: the site's 16px cell prints as an 8pt facet. */
const PX_PER_PT = 2;

/** The light-theme spin-drive inks, with the site's light `--primary` for the rare glints. */
const PRINT_COLORS: SpinColors = { ink: "#6f6f6f", glow: "#39342e", red: "#cc2a26" };

const FROZEN_TIME = 0;
const INTENSITY = 0.9;
const MAX_OPACITY = 0.42;
const LIGHT = { x: 0.2, y: 0.25 };

let cached: string | null = null;

export function headerTexture(): string {
    if (cached) return cached;
    const w = PAGE.widthPt * PX_PER_PT, h = TEXTURE_HEIGHT_PT * PX_PER_PT;
    cached = spinFacetsSvg(
        {
            w,
            h,
            t: FROZEN_TIME,
            cell: 16,
            light: { x: w * LIGHT.x, y: h * LIGHT.y },
            colors: PRINT_COLORS,
            mask: headerCanopyMask(PX_PER_PT),
            intensity: INTENSITY,
            maxOpacity: MAX_OPACITY,
        },
        { w: PAGE.widthPt, h: TEXTURE_HEIGHT_PT },
    );
    return cached;
}
