import { bubblePhase, POP_SECONDS, type BubbleSwarm } from "../bubbles";
import type { CharGrid } from "./char-grid";
import type { GlyphRows } from "./glyph-rows";
import { BUCKET_MID, BUCKET_STRONG } from "./water-glyphs";

const code = (char: string) => char.charCodeAt(0);
const SPECK = code("."), SMALL = code("o"), LARGE = code("O"), RING = code("°"), SPLASH = code("*");

/** A bubble grows from a speck to a full `O`, then pops through a splash. */
const bubbleGlyph = (phase: number, size: number, life: number) => {
    if (phase > 1) return (phase - 1) * life < POP_SECONDS * 0.5 ? SPLASH : RING;
    if (phase < 0.18) return SPECK;
    return size > 0.55 && phase > 0.45 ? LARGE : SMALL;
};

export function drawBubbleGlyphs(rows: GlyphRows, chars: CharGrid, swarm: BubbleSwarm, cellPx: number) {
    for (const bubble of swarm.bubbles) {
        const i = Math.floor((bubble.x * cellPx) / chars.cellW);
        const j = Math.floor((bubble.y * cellPx) / chars.cellH);
        if (i < 0 || j < 0 || i >= chars.cols || j >= chars.rows) continue;
        const phase = bubblePhase(bubble);
        rows.replace(j * chars.cols + i, bubbleGlyph(phase, bubble.size, bubble.life), phase > 1 ? BUCKET_MID : BUCKET_STRONG);
    }
}
