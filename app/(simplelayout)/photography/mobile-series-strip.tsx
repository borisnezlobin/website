"use client";

import Link from "next/link";
import type { SeriesSummary } from "@/app/lib/photo-types";

const CARD_HEIGHT = 220;

export default function MobileSeriesStrip({ series }: { series: SeriesSummary[] }) {
  if (series.length === 0) return null;
  return (
    <section className="px-4 mb-6">
      <h2 className="text-sm text-muted dark:text-muted-dark mb-2">Series</h2>
      <div className="-mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SeriesCard({ series }: { series: SeriesSummary }) {
  const cover = series.coverPhotos[0];
  const ratio =
    cover && cover.width > 0 && cover.height > 0 ? cover.width / cover.height : 1;
  const width = Math.min(CARD_HEIGHT * ratio, CARD_HEIGHT * 2);

  return (
    <Link
      href={`/photography/series/${series.slug}`}
      className="group flex-shrink-0 flex flex-col"
      style={{ width }}
    >
      <div
        className="relative overflow-hidden rounded-md bg-black/10 dark:bg-white/5"
        style={{ width, height: CARD_HEIGHT }}
      >
        {cover && (
          <img
            src={cover.thumbUrl}
            alt={series.title}
            crossOrigin="anonymous"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        {/* Gradient ensures readable contrast for the title + count over any photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 pointer-events-none" />
        {/* <footer> instead of <div> so the obsidian.css `div:not(.callout)` rule
            doesn't override the text colors below. */}
        <footer className="absolute bottom-0 left-0 right-0 p-3">
          <span className="vectra text-3xl !text-primary dark:!text-primary-dark block leading-tight">
            {series.title}
          </span>
          <span className="block text-sm !text-white/80 mt-0.5">
            {series.count} photo{series.count === 1 ? "" : "s"}
          </span>
        </footer>
      </div>
    </Link>
  );
}
