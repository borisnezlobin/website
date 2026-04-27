"use client";

import { useMemo } from "react";
import type { Photo } from "@/app/lib/photo-types";
import type { MosaicCell } from "@/app/lib/mosaic";

export type JumblePosition = { u: number; v: number; rotation: number };

export type Tile = {
  index: number;
  photo: Photo;
  cell: { x: number; y: number } | null;
  jumble: JumblePosition;
};

export function hashSlug(slug: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function jumblePosition(seed: string): JumblePosition {
  const h = hashSlug(seed);
  return {
    u: (h & 0xffff) / 0xffff,
    v: ((h >>> 16) & 0xffff) / 0xffff,
    rotation: (((h >>> 8) & 0xff) / 0xff - 0.5) * 30,
  };
}

export function useMosaicTiles(photos: Photo[], cells: MosaicCell[], gridSize: number): Tile[] {
  return useMemo(() => {
    const total = gridSize * gridSize;
    const tiles: Tile[] = new Array(total);
    if (cells.length === total) {
      for (let i = 0; i < total; i++) {
        const c = cells[i];
        tiles[i] = {
          index: i,
          photo: c.photo,
          cell: { x: c.x, y: c.y },
          jumble: jumblePosition(`${c.photo.slug}-${i}`),
        };
      }
      return tiles;
    }
    if (photos.length === 0) return [];
    for (let i = 0; i < total; i++) {
      const photo = photos[i % photos.length];
      tiles[i] = {
        index: i,
        photo,
        cell: null,
        jumble: jumblePosition(`${photo.slug}-${i}`),
      };
    }
    return tiles;
  }, [photos, cells, gridSize]);
}

export type TilePose = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

/**
 * Compute a tile's pose for a given mode. Pure function — used by both the
 * snapshot logic (when mode flips) and the rendering loop.
 */
export function poseForTile(
  tile: Tile,
  mode: "jumble" | "mosaic",
  cellSize: number,
  range: number,
): TilePose {
  if (mode === "mosaic" && tile.cell) {
    return { x: tile.cell.x * cellSize, y: tile.cell.y * cellSize, rotation: 0, scale: 1 };
  }
  return {
    x: tile.jumble.u * range,
    y: tile.jumble.v * range,
    rotation: tile.jumble.rotation,
    scale: 1,
  };
}
