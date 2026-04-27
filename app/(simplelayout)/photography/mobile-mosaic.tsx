"use client";

import { useEffect, useMemo, useState } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import BackToTop from "./back-to-top";
import CategoryChips from "./category-chips";
import MobileGalleryGrid from "./mobile-gallery-grid";
import MosaicFrame from "./mosaic-frame";
import { useMosaicState } from "./use-mosaic-state";

const GRID_SIZE = 64;
const MAX_MOSAIC_SIDE = 520;
const MIN_MOSAIC_SIDE = 240;

type Props = {
  photos: Photo[];
  categories: Category[];
  onOpenPhoto: (photoId: string) => void;
};

export default function MobileMosaic({ photos, categories, onOpenPhoto }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const side = useMosaicSide();

  const usableCategories = useMemo(
    () => categories.filter((c) => c.count > 0),
    [categories],
  );

  const { mode, cells, loading, error } = useMosaicState(photos, activeCategory, GRID_SIZE);

  const galleryPhotos = useMemo(
    () => activeCategory
      ? photos.filter((p) => p.categorySlugs.includes(activeCategory.slug))
      : photos,
    [activeCategory, photos],
  );

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground">
      <header className="px-4 pt-4 pb-2 flex items-baseline justify-between">
        <h1 className="vectra text-3xl">Photography</h1>
        <span className="text-[10px] tracking-widest text-muted dark:text-muted-dark">
          {photos.length} photos
        </span>
      </header>

      <CategoryChips
        categories={usableCategories}
        activeSlug={activeCategory?.slug ?? null}
        onPick={setActiveCategory}
        onScramble={() => setActiveCategory(null)}
      />

      <div className="flex justify-center px-3 pt-1 pb-3">
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

      <p className="px-4 mb-4 text-center text-xs italic text-muted dark:text-muted-dark">
        {captionFor({ loading, error, mode, activeCategory, galleryCount: galleryPhotos.length, totalCount: photos.length })}
      </p>

      {galleryPhotos.length > 0 && (
        <MobileGalleryGrid photos={galleryPhotos} onOpenPhoto={onOpenPhoto} />
      )}

      <BackToTop />
    </div>
  );
}

function useMosaicSide(): number {
  const [side, setSide] = useState(0);
  useEffect(() => {
    const measure = () => {
      const next = Math.min(window.innerWidth - 24, MAX_MOSAIC_SIDE);
      setSide(Math.max(MIN_MOSAIC_SIDE, next));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return side;
}

function captionFor({
  loading, error, mode, activeCategory, galleryCount, totalCount,
}: {
  loading: boolean;
  error: string | null;
  mode: "jumble" | "mosaic";
  activeCategory: Category | null;
  galleryCount: number;
  totalCount: number;
}): string {
  if (loading) return "Loading…";
  if (error) return error;
  if (mode === "jumble") return `${totalCount} photos · pick a category to assemble it.`;
  if (!activeCategory) return "";
  return `${galleryCount} photo${galleryCount === 1 ? "" : "s"} in ${activeCategory.label}.`;
}
