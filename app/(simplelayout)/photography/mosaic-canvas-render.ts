"use client";

import type { Tile, TilePose } from "./mosaic-tile-data";

/**
 * Draw the mosaic state to a 2D canvas. `positions` is a Float32Array packing
 * 4 floats per tile (x, y, rotation, scale) — interpolated by the animation
 * loop. Photos that haven't loaded yet are drawn as a flat fill from the
 * photo's stored OKLab→sRGB color, so nothing is blank.
 */
export function drawMosaic(
  ctx: CanvasRenderingContext2D,
  tiles: Tile[],
  positions: Float32Array,
  cellSize: number,
  side: number,
  images: Map<string, HTMLImageElement>,
  previewIndex: number | null,
  dpr: number,
): void {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, side, side);

  const drawOrder = previewIndex == null
    ? tiles
    : [...tiles.slice(0, previewIndex), ...tiles.slice(previewIndex + 1), tiles[previewIndex]];

  for (const tile of drawOrder) {
    const i = tile.index;
    const x = positions[i * 4];
    const y = positions[i * 4 + 1];
    const rotation = positions[i * 4 + 2];
    const scale = positions[i * 4 + 3];
    const img = images.get(tile.photo.id);
    const ready = img && img.complete && img.naturalWidth > 0;

    ctx.save();
    const cx = x + cellSize / 2;
    const cy = y + cellSize / 2;
    ctx.translate(cx, cy);
    if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
    if (scale !== 1) ctx.scale(scale, scale);

    if (ready) {
      ctx.drawImage(img, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
    } else {
      // Fallback: flat fill in the photo's mean color so the mosaic shape
      // still reads even before tile images have loaded.
      ctx.fillStyle = tileFallbackColor(tile);
      ctx.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
    }
    ctx.restore();
  }

  ctx.restore();
}

function tileFallbackColor(tile: Tile): string {
  const c = tile.photo.color;
  if (!Array.isArray(c) || c.length !== 3) return "#1a1714";
  // c is OKLab [L, a, b]. Convert to sRGB via the inverse transform.
  const L = c[0];
  const a = c[1];
  const b = c[2];
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;
  const r = +4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const g = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const bLin2 = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.707614701 * sLin;
  return `rgb(${toByte(r)}, ${toByte(g)}, ${toByte(bLin2)})`;
}

function toByte(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(Math.max(0, linear), 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, c)) * 255);
}

/**
 * Hit-test a (x, y) point in canvas-space against the current tile positions.
 * Returns the topmost tile whose bounds contain the point, or null.
 *
 * Iterates in reverse so a long-pressed (preview-scaled) tile drawn last wins.
 */
export function hitTestTile(
  tiles: Tile[],
  positions: Float32Array,
  cellSize: number,
  px: number,
  py: number,
  previewIndex: number | null,
): Tile | null {
  // If a preview is active, that tile was drawn on top — check it first.
  if (previewIndex != null) {
    const t = tiles[previewIndex];
    if (t && pointInTile(positions, cellSize, t.index, px, py)) return t;
  }
  for (let i = tiles.length - 1; i >= 0; i--) {
    if (pointInTile(positions, cellSize, i, px, py)) return tiles[i];
  }
  return null;
}

function pointInTile(positions: Float32Array, cellSize: number, i: number, px: number, py: number): boolean {
  const x = positions[i * 4];
  const y = positions[i * 4 + 1];
  const scale = positions[i * 4 + 3];
  const half = (cellSize * scale) / 2;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  return Math.abs(px - cx) <= half && Math.abs(py - cy) <= half;
}

export function fillPositions(
  out: Float32Array,
  tiles: Tile[],
  poses: (i: number) => TilePose,
): void {
  for (let i = 0; i < tiles.length; i++) {
    const p = poses(i);
    out[i * 4] = p.x;
    out[i * 4 + 1] = p.y;
    out[i * 4 + 2] = p.rotation;
    out[i * 4 + 3] = p.scale;
  }
}
