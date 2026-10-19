import type { GlyphAtlas } from "../ascii/glyph-atlas";
import type { InkLevel } from "../ascii/glyph-rows";
import { LINE_FADE, LINE_LIFE, type TextLine, type TextRiver } from "./text-lines";

/**
 * Stamps every drifting character from a glyph sheet, turned to follow its own line: each one
 * takes the direction from its neighbour before to its neighbour after, so a line bending round a
 * rock bends letter by letter.
 */
export const DAY_CODE_LEVELS: InkLevel[] = [
    { alpha: 0.4, weight: 400 }, { alpha: 0.78, weight: 400 }, { alpha: 0.55, weight: 400 },
    { alpha: 0.95, weight: 500 }, { alpha: 0.95, weight: 500, red: true },
];
export const NIGHT_CODE_LEVELS: InkLevel[] = [
    { alpha: 0.38, weight: 400 }, { alpha: 0.82, weight: 400 }, { alpha: 0.56, weight: 400 },
    { alpha: 1, weight: 500 }, { alpha: 1, weight: 500, red: true },
];

function neighbourAngle(line: TextLine, i: number) {
    const before = i > 0 && line.alive[i - 1] ? i - 1 : i;
    const after = i < line.count - 1 && line.alive[i + 1] ? i + 1 : i;
    if (before === after) return line.angle;
    return Math.atan2(line.y[after] - line.y[before], line.x[after] - line.x[before]);
}

function stampLine(ctx: CanvasRenderingContext2D, line: TextLine, atlas: GlyphAtlas, height: number) {
    const { canvas, column, tileW, tileH, dpr } = atlas;
    const w = tileW / dpr, h = tileH / dpr;
    for (let i = 0; i < line.count; i++) {
        const g = column[line.codes[i]];
        if (!line.alive[i] || g < 0 || line.y[i] < -h || line.y[i] > height + h) continue;
        const angle = neighbourAngle(line, i);
        const cos = Math.cos(angle) * dpr, sin = Math.sin(angle) * dpr;
        ctx.setTransform(cos, sin, -sin, cos, line.x[i] * dpr, line.y[i] * dpr);
        ctx.drawImage(canvas, g * tileW, line.styles[i] * tileH, tileW, tileH, -w / 2, -h / 2, w, h);
    }
}

export function stampRiver(ctx: CanvasRenderingContext2D, river: TextRiver, atlas: GlyphAtlas, height: number) {
    for (const line of river.lines) {
        ctx.globalAlpha = Math.min(1, line.age / 0.4, (LINE_LIFE - line.age) / LINE_FADE);
        stampLine(ctx, line, atlas, height);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(atlas.dpr, 0, 0, atlas.dpr, 0, 0);
}
