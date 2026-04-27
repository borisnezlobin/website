"use client";

import { useEffect, useState } from "react";
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
    let cancelled = false;
    setLoading(true);
    setError(null);
    buildMosaicCells(hero.thumbUrl, photos, gridSize)
      .then((c) => {
        if (!cancelled) setCells(c);
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
