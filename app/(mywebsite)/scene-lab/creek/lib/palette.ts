import type { SpinColors } from "@/app/lib/spin-drive";

/** The creek by day (ink on paper) and by night (warm light grey on the site's dark brown). */
export type CreekPalette = {
    paper: string;
    ink: string;
    red: string;
    paperRgb: [number, number, number];
    inkRgb: [number, number, number];
    redRgb: [number, number, number];
    /** Wet stone: the darkest mass in the scene, by day and by night. */
    stone: string;
    /** A faint tint over the channel so water and bank separate even where both are sparse. */
    water: string;
    /** The wet edge of a rock, catching the light where the water laps at it. */
    rim: string;
    /** Spin-drive colours for facets catching light on that stone. */
    facets: SpinColors;
};

const hexToRgb = (hex: string): [number, number, number] => {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

type Tones = { paper: string; ink: string; red: string; stone: string; water: string; rim: string };

const palette = ({ paper, ink, red, stone, water, rim }: Tones, facets: SpinColors): CreekPalette => ({
    paper, ink, red, stone, water, rim, facets,
    paperRgb: hexToRgb(paper),
    inkRgb: hexToRgb(ink),
    redRgb: hexToRgb(red),
});

export const DAY = palette({ paper: "#f5f5f5", ink: "#3c3c3c", red: "#CC2A26", stone: "#34312d", water: "#ebe9e5", rim: "rgba(245, 245, 245, 0.35)" }, { ink: "#9a958e", glow: "#f5f5f5", red: "#E04A3F" });
export const NIGHT = palette({ paper: "#1a1714", ink: "#d6d0c8", red: "#E96457", stone: "#3b342e", water: "#13110f", rim: "rgba(214, 208, 200, 0.4)" }, { ink: "#6f6962", glow: "#f4efe6", red: "#E96457" });

export const creekPalette = (dark: boolean) => (dark ? NIGHT : DAY);
