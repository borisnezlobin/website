"use client";

import { CaretRightIcon, FilmStripIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { SeriesSummary } from "@/app/lib/photo-types";

export default function SeriesList({
  series,
  loading,
  onCreate,
  onEdit,
}: {
  series: SeriesSummary[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (slug: string) => void;
}) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon size={18} />
          New Series
        </button>
      </div>
      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : series.length === 0 ? (
        <div className="text-center py-16 text-muted dark:text-muted-dark">
          <FilmStripIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No series yet. Create one to start grouping photos into ordered narratives.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {series.map((s) => (
            <button
              key={s.id}
              onClick={() => onEdit(s.slug)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-sm text-muted truncate">
                  {s.description || `photos.borisnezlobin.com/${s.slug}`}
                </div>
                <div className="text-xs text-muted mt-1">
                  {s.count} photo{s.count === 1 ? "" : "s"} · slug: {s.slug}
                </div>
              </div>
              <CaretRightIcon size={20} className="text-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
