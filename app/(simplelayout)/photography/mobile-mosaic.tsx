"use client";

import { useEffect, useMemo, useState } from "react";
import type { Photo, Category, SeriesSummary } from "@/app/lib/photo-types";
import BackToTop from "./back-to-top";
import CategoryChips from "./category-chips";
import MobileGalleryGrid from "./mobile-gallery-grid";
import MobileSeriesStrip from "./mobile-series-strip";
import MosaicFrame from "./mosaic-frame";
import { useMosaicState } from "./use-mosaic-state";

const GRID_SIZE = 64;
const MAX_MOSAIC_SIDE = 520;
const MIN_MOSAIC_SIDE = 240;

type Props = {
  photos: Photo[];
  categories: Category[];
  series: SeriesSummary[];
  onOpenPhoto: (photoId: string) => void;
};

export default function MobileMosaic({ photos, categories, series, onOpenPhoto }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const side = useMosaicSide();

  // Photos that should appear in the visible gallery grid (and contribute to
  // the chip count) — hidden-from-gallery photos still feed the mosaic tile
  // pool but don't show up here.
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

  // Mosaic still receives the full photo set so hidden photos can be tile sources.
  const { mode, cells, loading, error } = useMosaicState(photos, activeCategory, GRID_SIZE);

  const galleryPhotos = useMemo(
    () => activeCategory
      ? visiblePhotos.filter((p) => p.categorySlugs.includes(activeCategory.slug))
      : visiblePhotos,
    [activeCategory, visiblePhotos],
  );

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground">
      <header className="px-4 pt-4 pb-2 flex items-baseline justify-between">
        <h1 className="vectra text-3xl">Photography</h1>
        <span className="text-sm text-muted dark:text-muted-dark">
          {visiblePhotos.length} photos
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
        {captionFor({ loading, error, mode, activeCategory, galleryCount: galleryPhotos.length, totalCount: visiblePhotos.length })}
      </p>

      {/* Series only show in jumble mode — once a category is picked, the
          gallery section below is the focus. */}
      {!activeCategory && <MobileSeriesStrip series={series} />}

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
