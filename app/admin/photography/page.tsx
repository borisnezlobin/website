"use client";

import { useState } from "react";
import { FilmStripIcon, ImageSquareIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import PhotoList from "./photo-list";
import PhotoEditor from "./photo-editor";
import CategoryManager from "./category-manager";
import SeriesManager from "./series-manager";
import { useAdminFetch } from "./use-admin-fetch";
import type { Photo } from "./types";

type View = "photos" | "categories" | "series";

export default function PhotographyAdminPage() {
  const [view, setView] = useState<View>("photos");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { photos, categories, loading, refetch } = useAdminFetch();

  if (selectedPhoto || isCreating) {
    return (
      <PhotoEditor
        photo={selectedPhoto}
        isCreating={isCreating}
        categories={categories}
        onBack={() => {
          setSelectedPhoto(null);
          setIsCreating(false);
          refetch();
        }}
        onSaved={(p) => {
          setSelectedPhoto(p);
          setIsCreating(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Photography</h1>
        </header>

        <nav className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          <ViewTab label="Photos" icon={<ImageSquareIcon size={16} />} active={view === "photos"} onClick={() => setView("photos")} />
          <ViewTab label="Categories" icon={<TagIcon size={16} />} active={view === "categories"} onClick={() => setView("categories")} />
          <ViewTab label="Series" icon={<FilmStripIcon size={16} />} active={view === "series"} onClick={() => setView("series")} />
        </nav>

        {view === "photos" && (
          <PhotoList
            photos={photos}
            loading={loading}
            categories={categories}
            onCreate={() => {
              setSelectedPhoto(null);
              setIsCreating(true);
            }}
            onSelect={(p) => {
              setSelectedPhoto(p);
              setIsCreating(false);
            }}
          />
        )}
        {view === "categories" && (
          <CategoryManager
            categories={categories}
            photos={photos}
            onChange={refetch}
          />
        )}
        {view === "series" && (
          <SeriesManager photos={photos} />
        )}
      </div>
    </div>
  );
}

function ViewTab({
  label, icon, active, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-neutral-900 dark:border-white text-black dark:text-white"
          : "border-transparent text-muted hover:text-black dark:hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
