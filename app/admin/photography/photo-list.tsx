"use client";

import { CaretRightIcon, ImageSquareIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Category, Photo } from "./types";

export default function PhotoList({
  photos,
  loading,
  categories,
  onCreate,
  onSelect,
}: {
  photos: Photo[];
  loading: boolean;
  categories: Category[];
  onCreate: () => void;
  onSelect: (p: Photo) => void;
}) {
  const labelBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.label]));

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon size={18} />
          Add Photo
        </button>
      </div>
      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 text-muted dark:text-muted-dark">
          <ImageSquareIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No photos yet. Add your first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {photos.map((photo) => (
            <PhotoListItem
              key={photo.id}
              photo={photo}
              categoryLabels={photo.categorySlugs.map((s) => labelBySlug[s] ?? s)}
              onSelect={() => onSelect(photo)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PhotoListItem({
  photo,
  categoryLabels,
  onSelect,
}: {
  photo: Photo;
  categoryLabels: string[];
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left"
    >
      <img
        src={photo.thumbUrl}
        alt={photo.title}
        className="w-16 h-16 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{photo.title}</div>
        <div className="text-sm text-muted truncate">
          {categoryLabels.length > 0 ? categoryLabels.join(" · ") : "Uncategorized"}
        </div>
        <div className="text-xs text-muted mt-1">
          {photo.width}×{photo.height} · {photo.likes} likes
        </div>
      </div>
      <CaretRightIcon size={20} className="text-muted flex-shrink-0" />
    </button>
  );
}
