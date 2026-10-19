import { IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";

/** JetBrains Mono for the ASCII water: its variable weights give the ink levels, and it has ° and box glyphs. */
export const asciiMono = JetBrains_Mono({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

/** IBM Plex Mono for the drifting code lines: calmer, more editorial shapes that stay legible when rotated. */
export const riverMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], display: "swap" });

/** Resolves once the given weights of a family are ready for canvas drawing. */
export async function loadCanvasFont(fontFamily: string, weights: number[]) {
    await Promise.all(weights.map((weight) => document.fonts.load(`${weight} 16px ${fontFamily}`)));
}
