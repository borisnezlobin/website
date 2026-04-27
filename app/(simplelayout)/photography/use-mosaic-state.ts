"use client";

import { useEffect, useRef, useState } from "react";
import { buildMosaicCells, type MosaicCell } from "@/app/lib/mosaic";
import type { Category, Photo } from "@/app/lib/photo-types";

export type MosaicMode = "jumble" | "mosaic";

export type MosaicState = {
  mode: MosaicMode;
  activeCategory: Category | null;
  cells: MosaicCell[];
  loading: boolean;
  error: string | null;
};

export function useMosaicState(
  photos: Photo[],
  category: Category | null,
  gridSize: number,
): MosaicState {
  const [cells, setCells] = useState<MosaicCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache the computed cells per (category, gridSize) so re-picking a
  // category we've already assembled is instant.
  const cacheRef = useRef<Map<string, MosaicCell[]>>(new Map());

  useEffect(() => {
    if (!category) {
      setCells([]);
      setError(null);
      return;
    }
    const hero = photos.find((p) => p.id === category.heroPhotoId);
    if (!hero) {
      setError("This category has no hero photo set.");
      setCells([]);
      return;
    }

    const cacheKey = `${category.slug}@${gridSize}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setCells(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    buildMosaicCells(hero.thumbUrl, photos, gridSize)
      .then((c) => {
        if (cancelled) return;
        cacheRef.current.set(cacheKey, c);
        setCells(c);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the hero image.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, photos, gridSize]);

  return {
    mode: category ? "mosaic" : "jumble",
    activeCategory: category,
    cells,
    loading,
    error,
  };
}
