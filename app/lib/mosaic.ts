import { rgbToOklab } from "./photo-color";
import type { Photo } from "./photo-types";

export type MosaicCell = {
  x: number;
  y: number;
  photo: Photo;
};

export async function buildMosaicCells(
  heroUrl: string,
  photos: Photo[],
  gridSize: number,
): Promise<MosaicCell[]> {
  if (photos.length === 0) return [];
  const img = await loadImage(heroUrl);
  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, gridSize, gridSize);
  const data = ctx.getImageData(0, 0, gridSize, gridSize).data;

  const eligible = photos.filter((p) => Array.isArray(p.color) && p.color.length === 3);
  const pool = eligible.length > 0 ? eligible : photos;
  const cells: MosaicCell[] = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const o = (y * gridSize + x) * 4;
      const target = rgbToOklab(data[o], data[o + 1], data[o + 2]);
      let best = pool[0];
      let bestD = Infinity;
      for (const p of pool) {
        const d0 = p.color[0] - target[0];
        const d1 = p.color[1] - target[1];
        const d2 = p.color[2] - target[2];
        const d = d0 * d0 + d1 * d1 + d2 * d2;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      cells.push({ x, y, photo: best });
    }
  }
  return cells;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Append a query param so the request is keyed separately from any
    // cached non-CORS response of the same URL (mobile Safari is strict
    // about reusing tainted cache entries).
    img.src = `${url}${url.includes("?") ? "&" : "?"}mosaic=1`;
  });
}
