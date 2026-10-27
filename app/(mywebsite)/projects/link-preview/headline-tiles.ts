import { CELL } from "../canopy/dither/surface";
import { makeCanvas } from "../canopy/paper";
import type { SceneSize } from "../canopy/scene-loop";

/** Each landed petal covers this many dither cells a side. */
export const TILE_CELLS = 2;
export const TILE_PX = TILE_CELLS * CELL;
/** Coverage below this (out of 255) leaves a tile empty, so faint antialiasing doesn't call down a petal. */
const MIN_COVERAGE = 40;

export type HeadlineSetting = { left: number; baseline: number; fontSize: number; fontFamily: string };

/** One petal's landing place: the top-left cell of its tile and the tile's centre in CSS px. */
export type Tile = { column: number; row: number; x: number; y: number; isPeriod: boolean };

/** A headline drawn into a density-sized mask (letters in the ink channel, the full stop in the blossom one) and cut into tiles. */
export type Headline = { mask: HTMLCanvasElement; tiles: Tile[]; left: number; right: number };

function drawMask(text: string, size: SceneSize, setting: HeadlineSetting) {
    const mask = makeCanvas(Math.ceil(size.width / CELL), Math.ceil(size.height / CELL));
    const ctx = mask.getContext("2d", { willReadFrequently: true })!;
    ctx.scale(1 / CELL, 1 / CELL);
    ctx.font = `${setting.fontSize}px ${setting.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    const words = text.endsWith(".") ? text.slice(0, -1) : text;
    ctx.fillStyle = "#ff0000";
    ctx.fillText(words, setting.left, setting.baseline);
    const wordsWidth = ctx.measureText(words).width;
    if (words !== text) {
        ctx.fillStyle = "#00ff00";
        ctx.fillText(".", setting.left + wordsWidth, setting.baseline);
    }
    return { mask, right: setting.left + ctx.measureText(text).width };
}

function tileCoverage(data: Uint8ClampedArray, columns: number, column: number, row: number) {
    let ink = 0;
    let bloom = 0;
    for (let dy = 0; dy < TILE_CELLS; dy++) {
        for (let dx = 0; dx < TILE_CELLS; dx++) {
            const at = ((row + dy) * columns + column + dx) * 4;
            ink = Math.max(ink, data[at]);
            bloom = Math.max(bloom, data[at + 1]);
        }
    }
    return { ink, bloom };
}

function cutTiles(mask: HTMLCanvasElement) {
    const { width: columns, height: rows } = mask;
    const data = mask.getContext("2d")!.getImageData(0, 0, columns, rows).data;
    const tiles: Tile[] = [];
    for (let row = 0; row + TILE_CELLS <= rows; row += TILE_CELLS) {
        for (let column = 0; column + TILE_CELLS <= columns; column += TILE_CELLS) {
            const { ink, bloom } = tileCoverage(data, columns, column, row);
            if (Math.max(ink, bloom) < MIN_COVERAGE) continue;
            tiles.push({ column, row, x: (column + TILE_CELLS / 2) * CELL, y: (row + TILE_CELLS / 2) * CELL, isPeriod: bloom > ink });
        }
    }
    return tiles;
}

export function setHeadline(text: string, size: SceneSize, setting: HeadlineSetting): Headline {
    const { mask, right } = drawMask(text, size, setting);
    return { mask, tiles: cutTiles(mask), left: setting.left, right };
}

/** Paints a landed tile's piece of the headline into the density buffer, which is set up in CSS px. */
export function paintTile(density: CanvasRenderingContext2D, headline: Headline, tile: Tile) {
    density.drawImage(headline.mask, tile.column, tile.row, TILE_CELLS, TILE_CELLS, tile.column * CELL, tile.row * CELL, TILE_PX, TILE_PX);
}
