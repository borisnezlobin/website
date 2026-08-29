"use client";

import { useEffect, useState } from "react";
import type { Photo, Category, SeriesSummary } from "@/app/lib/photo-types";
import BackToTop from "./back-to-top";
import CategoryChips from "./category-chips";
import GalleryGrid from "./gallery-grid";
import SeriesStrip from "./series-strip";
import MosaicFrame from "./mosaic-frame";
import { useMosaicState } from "./use-mosaic-state";
import type { GallerySelection } from "./use-gallery-selection";

const GRID_SIZE = 64;
const MIN_MOSAIC_SIDE = 240;
const MAX_MOSAIC_SIDE = 620;
// The mosaic is square, so it fits the shorter axis. On desktop it lives in the
// left column, which is capped at a quarter of the viewport so the grid beside
// it gets the room; the width cap wins there even if it goes below MIN.
const DESKTOP_COLUMN_SHARE = 0.25;
const VIEWPORT_HEIGHT_SHARE = 0.62;
const DESKTOP_MIN_WIDTH = 768;

type Props = {
  photos: Photo[];
  series: SeriesSummary[];
  selection: GallerySelection;
  onOpenPhoto: (photoId: string) => void;
};

export default function Gallery({ photos, series, selection, onOpenPhoto }: Props) {
  const { activeCategory, pickCategory, scramble, visiblePhotos, galleryPhotos, usableCategories } = selection;
  const side = useMosaicSide();

  // Mosaic still receives the full photo set so hidden photos can be tile sources.
  const { mode, cells, loading, error } = useMosaicState(photos, activeCategory, GRID_SIZE);
  const caption = captionFor({ loading, error, mode, activeCategory, galleryCount: galleryPhotos.length });

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground">
      <header className="px-4 md:px-8 pt-4 md:pt-8 pb-2 flex items-baseline justify-between">
        <h1 className="vectra text-3xl md:text-4xl">Photography</h1>
        <span className="text-sm text-muted dark:text-muted-dark">
          {visiblePhotos.length} photos
        </span>
      </header>

      <CategoryChips
        categories={usableCategories}
        activeSlug={activeCategory?.slug ?? null}
        onPick={pickCategory}
        onScramble={scramble}
      />

      <div className="flex flex-col md:flex-row md:items-start md:gap-8 md:px-6">
        {/* Pinned to the mosaic's own width on desktop so the series strip below it
            can't widen the column past its quarter-viewport budget. */}
        <div
          className="md:flex-shrink-0 md:sticky md:top-6 md:w-[var(--mosaic-side)]"
          style={{ "--mosaic-side": `${side}px` } as React.CSSProperties}
        >
          <div className="flex justify-center px-3 md:px-0 pt-1 pb-3">
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
          {caption && (
            <p className="px-4 mb-4 text-center text-xs italic text-muted dark:text-muted-dark">
              {caption}
            </p>
          )}

          <SeriesStrip series={series} />
        </div>

        <section className="flex-1 min-w-0">
          <h2 className="px-4 md:px-0 mb-3 text-lg">
            {activeCategory ? activeCategory.label : "All photos"}
            <span className="ml-2 text-sm text-muted dark:text-muted-dark">
              {galleryPhotos.length}
            </span>
          </h2>
          {galleryPhotos.length > 0 && (
            <GalleryGrid photos={galleryPhotos} onOpenPhoto={onOpenPhoto} />
          )}
        </section>
      </div>

      <BackToTop />
    </div>
  );
}

function useMosaicSide(): number {
  const [side, setSide] = useState(0);
  useEffect(() => {
    const measure = () => {
      const desktop = window.innerWidth >= DESKTOP_MIN_WIDTH;
      const widthBudget = desktop
        ? window.innerWidth * DESKTOP_COLUMN_SHARE
        : window.innerWidth - 24;
      const next = Math.min(
        widthBudget,
        window.innerHeight * VIEWPORT_HEIGHT_SHARE,
        MAX_MOSAIC_SIDE,
      );
      setSide(desktop ? next : Math.max(MIN_MOSAIC_SIDE, next));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return side;
}

function captionFor({
  loading, error, mode, activeCategory, galleryCount,
}: {
  loading: boolean;
  error: string | null;
  mode: "jumble" | "mosaic";
  activeCategory: Category | null;
  galleryCount: number;
}): string {
  if (loading) return "Loading…";
  if (error) return error;
  if (mode === "jumble" || !activeCategory) return "";
  return `${galleryCount} photo${galleryCount === 1 ? "" : "s"} in ${activeCategory.label}.`;
}
