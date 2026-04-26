"use client";

import { useEffect, useMemo, useState } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import CategoryChips from "./category-chips";
import MosaicFrame from "./mosaic-frame";
import { useMosaicState } from "./use-mosaic-state";

const GRID_SIZE = 64;

type Props = {
  photos: Photo[];
  categories: Category[];
  onOpenPhoto: (photoId: string) => void;
};

export default function MobileMosaic({ photos, categories, onOpenPhoto }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const measure = () => {
      const next = Math.min(window.innerWidth - 32, window.innerHeight * 0.55);
      setSide(Math.max(240, next));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const usableCategories = useMemo(
    () => categories.filter((c) => c.count > 0),
    [categories],
  );

  const { mode, cells, loading, error } = useMosaicState(photos, activeCategory, GRID_SIZE);

  const captionPool = activeCategory
    ? photos.filter((p) => p.categorySlugs.includes(activeCategory.slug))
    : photos;

  return (
    <div className="fixed inset-0 bg-[#0d0b09] text-white flex flex-col pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="vectra text-2xl">Photography</h1>
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          {photos.length} photos
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        {side > 0 && (
          <MosaicFrame
            photos={photos}
            cells={cells}
            mode={mode}
            gridSize={GRID_SIZE}
            side={side}
            onOpenPhoto={onOpenPhoto}
          />
        )}
      </div>

      <CategoryChips
        categories={usableCategories}
        activeSlug={activeCategory?.slug ?? null}
        onPick={setActiveCategory}
        onScramble={() => setActiveCategory(null)}
      />

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 text-center">
        <p className="text-xs italic text-white/50">
          {loading
            ? "Loading…"
            : error
            ? error
            : mode === "jumble"
            ? `${photos.length} photos · pick a category to assemble it.`
            : captionPool.length < 8
            ? `Small set — colors approximate. ${captionPool.length} photos in ${activeCategory?.label}.`
            : `${captionPool.length} photos in ${activeCategory?.label}.`}
        </p>
      </div>
    </div>
  );
}
