"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Photo } from "@/app/lib/photo-types";

export type GallerySelection = {
  activeCategory: Category | null;
  pickCategory: (category: Category | null) => void;
  scramble: () => void;
  /** Every photo flagged for the gallery, in feed order. */
  visiblePhotos: Photo[];
  /** What the grid renders and what the lightbox arrows walk through. */
  galleryPhotos: Photo[];
  /** Categories that actually have visible photos, with their counts. */
  usableCategories: (Category & { count: number })[];
};

// A seeded shuffle rather than Math.random() in the render path: the order has to
// survive re-renders, and it has to match the server's until the client has mounted
// or React tears down the tree with a hydration mismatch. The seed starts at 0
// (feed order, same as the server) and is rolled once on mount.
const shuffle = <T,>(items: T[], seed: number): T[] => {
  const out = [...items];
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const newSeed = () => Math.floor(Math.random() * 4294967295) + 1;

export function useGallerySelection(photos: Photo[], categories: Category[]): GallerySelection {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [seed, setSeed] = useState(0);

  useEffect(() => setSeed(newSeed()), []);

  const visiblePhotos = useMemo(() => photos.filter((p) => p.inGallery), [photos]);

  const usableCategories = useMemo(() => {
    const visibleByCategory = new Map<string, number>();
    for (const p of visiblePhotos) {
      for (const slug of p.categorySlugs) {
        visibleByCategory.set(slug, (visibleByCategory.get(slug) ?? 0) + 1);
      }
    }
    return categories
      .map((c) => ({ ...c, count: visibleByCategory.get(c.slug) ?? 0 }))
      .filter((c) => c.count > 0);
  }, [categories, visiblePhotos]);

  const galleryPhotos = useMemo(() => {
    if (!activeCategory) return seed === 0 ? visiblePhotos : shuffle(visiblePhotos, seed);
    const inCategory = visiblePhotos.filter((p) => p.categorySlugs.includes(activeCategory.slug));
    // The hero is the image the mosaic assembles into, so it leads the grid.
    const hero = inCategory.find((p) => p.id === activeCategory.heroPhotoId);
    const rest = hero ? inCategory.filter((p) => p.id !== hero.id) : inCategory;
    const ordered = seed === 0 ? rest : shuffle(rest, seed);
    return hero ? [hero, ...ordered] : ordered;
  }, [activeCategory, visiblePhotos, seed]);

  const pickCategory = useCallback((category: Category | null) => setActiveCategory(category), []);
  const scramble = useCallback(() => {
    setActiveCategory(null);
    setSeed(newSeed());
  }, []);

  return { activeCategory, pickCategory, scramble, visiblePhotos, galleryPhotos, usableCategories };
}
