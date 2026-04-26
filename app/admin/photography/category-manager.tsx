"use client";

import { useState } from "react";
import { PlusIcon, StarIcon, TagIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import type { Category, Photo } from "./types";

export default function CategoryManager({
  categories, photos, password, onChange,
}: {
  categories: Category[];
  photos: Photo[];
  password: string;
  onChange: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingHero, setEditingHero] = useState<string | null>(null);

  async function createCategory() {
    if (!newLabel.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || "Failed to create");
      else {
        setNewLabel("");
        onChange();
      }
    } finally {
      setBusy(false);
    }
  }

  async function setHero(catId: string, heroPhotoId: string | null) {
    setBusy(true);
    try {
      await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id: catId, heroPhotoId }),
      });
      setEditingHero(null);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(catId: string, label: string) {
    if (!window.confirm(`Delete category "${label}"? Photos will not be deleted, just unassociated.`)) return;
    setBusy(true);
    try {
      await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id: catId }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New category (e.g. Cars)"
          className="flex-1 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
          onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }}
        />
        <button
          onClick={createCategory}
          disabled={busy || !newLabel.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <PlusIcon size={16} /> Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted dark:text-muted-dark">
          <TagIcon size={40} className="mx-auto mb-3 opacity-50" />
          <p>No categories yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              photos={photos}
              isEditingHero={editingHero === cat.id}
              busy={busy}
              onToggleHeroEdit={() => setEditingHero(editingHero === cat.id ? null : cat.id)}
              onSetHero={(heroPhotoId) => setHero(cat.id, heroPhotoId)}
              onDelete={() => removeCategory(cat.id, cat.label)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category, photos, isEditingHero, busy, onToggleHeroEdit, onSetHero, onDelete,
}: {
  category: Category;
  photos: Photo[];
  isEditingHero: boolean;
  busy: boolean;
  onToggleHeroEdit: () => void;
  onSetHero: (heroPhotoId: string | null) => void;
  onDelete: () => void;
}) {
  const hero = category.heroPhotoId ? photos.find((p) => p.id === category.heroPhotoId) : null;
  const eligible = photos.filter((p) => p.categorySlugs.includes(category.slug));

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium">{category.label}</div>
          <div className="text-xs text-muted">
            {category.count} photo{category.count === 1 ? "" : "s"} · slug: {category.slug}
          </div>
        </div>
        {hero && (
          <img
            src={hero.thumbUrl}
            alt={hero.title}
            title={`Hero: ${hero.title}`}
            className="w-12 h-12 rounded object-cover"
          />
        )}
        <button
          onClick={onToggleHeroEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded hover:border-neutral-500 transition-colors"
        >
          <StarIcon size={14} weight={hero ? "fill" : "regular"} />
          Hero
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded transition-colors"
        >
          <TrashIcon size={16} />
        </button>
      </div>

      {isEditingHero && (
        <HeroPicker
          eligible={eligible}
          currentHeroId={category.heroPhotoId}
          onPick={(id) => onSetHero(id)}
        />
      )}
    </div>
  );
}

function HeroPicker({
  eligible, currentHeroId, onPick,
}: {
  eligible: Photo[];
  currentHeroId: string | null;
  onPick: (id: string | null) => void;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <p className="text-xs text-muted mb-3">
        Pick the photo the mosaic should resolve to. Only photos in this category are eligible.
      </p>
      {eligible.length === 0 ? (
        <p className="text-sm text-muted">No photos in this category yet.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {eligible.map((p) => {
            const isHero = currentHeroId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPick(isHero ? null : p.id)}
                className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                  isHero
                    ? "border-neutral-900 dark:border-white"
                    : "border-transparent hover:border-neutral-400"
                }`}
              >
                <img src={p.thumbUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                {isHero && (
                  <div className="absolute top-1 right-1 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full p-0.5">
                    <StarIcon size={10} weight="fill" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
