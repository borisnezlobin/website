"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "@/app/lib/photo-types";
import type { MosaicCell } from "@/app/lib/mosaic";
import type { MosaicMode } from "./use-mosaic-state";

const LONG_PRESS_MS = 320;

type Props = {
  photos: Photo[];
  cells: MosaicCell[];
  mode: MosaicMode;
  gridSize: number;
  side: number;
  onOpenPhoto: (photoId: string) => void;
};

type JumblePosition = { u: number; v: number; rotation: number };

function hashSlug(slug: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function jumblePosition(seed: string): JumblePosition {
  const h = hashSlug(seed);
  return {
    u: (h & 0xffff) / 0xffff,
    v: ((h >>> 16) & 0xffff) / 0xffff,
    rotation: (((h >>> 8) & 0xff) / 0xff - 0.5) * 30,
  };
}

export default function MosaicFrame({ photos, cells, mode, gridSize, side, onOpenPhoto }: Props) {
  const cellSize = side / gridSize;
  const tiles = useMosaicTiles(photos, cells, gridSize);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const longPressRef = useRef<{ slug: string; timer: number; moved: boolean } | null>(null);

  const startLongPress = (photo: Photo) => {
    longPressRef.current = {
      slug: photo.slug,
      moved: false,
      timer: window.setTimeout(() => {
        if (longPressRef.current && !longPressRef.current.moved) {
          setPreviewSlug(photo.slug);
        }
      }, LONG_PRESS_MS),
    };
  };

  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timer);
      longPressRef.current = null;
    }
    setPreviewSlug(null);
  };

  return (
    <div
      className="relative bg-black/40 rounded-md overflow-hidden"
      style={{ width: side, height: side }}
    >
      {tiles.map((t) => {
        const isPreview = previewSlug === t.photo.slug;
        const range = side - cellSize;
        const tx = mode === "mosaic" && t.cell
          ? t.cell.x * cellSize
          : t.jumble.u * range;
        const ty = mode === "mosaic" && t.cell
          ? t.cell.y * cellSize
          : t.jumble.v * range;
        const rotation = mode === "mosaic" ? 0 : t.jumble.rotation;
        const transitionDelay = `${(t.index % 50) * 6}ms`;
        return (
          <button
            key={t.index}
            onClick={() => {
              if (longPressRef.current?.moved) return;
              if (isPreview) return;
              onOpenPhoto(t.photo.id);
            }}
            onPointerDown={() => startLongPress(t.photo)}
            onPointerMove={() => {
              if (longPressRef.current) longPressRef.current.moved = true;
            }}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onPointerLeave={cancelLongPress}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: cellSize,
              height: cellSize,
              transform: `translate(${tx}px, ${ty}px) rotate(${rotation}deg) ${
                isPreview ? "scale(4)" : "scale(1)"
              }`,
              transition: `transform 1100ms cubic-bezier(.7,0,.2,1)`,
              transitionDelay,
              zIndex: isPreview ? 30 : 1,
            }}
            className="overflow-hidden"
            aria-label={t.photo.title}
          >
            <img
              src={t.photo.microUrl}
              alt=""
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover select-none"
            />
          </button>
        );
      })}
    </div>
  );
}

type Tile = {
  index: number;
  photo: Photo;
  cell: { x: number; y: number } | null;
  jumble: JumblePosition;
};

function useMosaicTiles(photos: Photo[], cells: MosaicCell[], gridSize: number): Tile[] {
  return useMemo(() => {
    const total = gridSize * gridSize;
    const tiles: Tile[] = [];
    if (cells.length === total) {
      for (let i = 0; i < total; i++) {
        const c = cells[i];
        tiles.push({
          index: i,
          photo: c.photo,
          cell: { x: c.x, y: c.y },
          jumble: jumblePosition(`${c.photo.slug}-${i}`),
        });
      }
    } else if (photos.length > 0) {
      for (let i = 0; i < total; i++) {
        const photo = photos[i % photos.length];
        tiles.push({
          index: i,
          photo,
          cell: null,
          jumble: jumblePosition(`${photo.slug}-${i}`),
        });
      }
    }
    return tiles;
  }, [photos, cells, gridSize]);
}
