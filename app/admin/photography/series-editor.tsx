"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowSquareOutIcon,
  FloppyDiskIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Message, Photo } from "./types";

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Form = { title: string; slug: string; description: string };

export default function SeriesEditor({
  slug,
  password,
  photos,
  onBack,
}: {
  slug: string | null;
  password: string;
  photos: Photo[];
  onBack: () => void;
}) {
  const isCreating = slug === null;
  const [form, setForm] = useState<Form>({ title: "", slug: "", description: "" });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isCreating);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (isCreating) return;
    setLoading(true);
    fetch(`/api/admin/series?slug=${encodeURIComponent(slug!)}`, {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.series) {
          setMessage({ type: "error", text: "Series not found" });
          return;
        }
        setForm({
          title: data.series.title,
          slug: data.series.slug,
          description: data.series.description ?? "",
        });
        setPhotoIds(data.series.photos.map((p: Photo) => p.id));
        setSeriesId(data.series.id);
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load series" }))
      .finally(() => setLoading(false));
  }, [slug, isCreating, password]);

  const photosById = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const p of photos) map.set(p.id, p);
    return map;
  }, [photos]);

  const availablePhotos = useMemo(
    () => photos.filter((p) => !photoIds.includes(p.id)),
    [photos, photoIds],
  );

  function changeTitle(value: string) {
    setForm((f) => ({ ...f, title: value, slug: slugManuallyEdited ? f.slug : titleToSlug(value) }));
  }

  function move(index: number, direction: -1 | 1) {
    setPhotoIds((ids) => {
      const next = [...ids];
      const target = index + direction;
      if (target < 0 || target >= next.length) return ids;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }
    if (!form.slug) {
      setMessage({ type: "error", text: "Slug is required" });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      if (isCreating) {
        const createRes = await fetch("/api/admin/series", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
          body: JSON.stringify({ title: form.title, slug: form.slug, description: form.description }),
        });
        const createData = await createRes.json();
        if (!createData.success) {
          setMessage({ type: "error", text: createData.error || "Failed to create" });
          setSaving(false);
          return;
        }
        // Now PUT the photos in order
        await fetch("/api/admin/series", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
          body: JSON.stringify({ id: createData.series.id, photoIds }),
        });
      } else {
        const res = await fetch("/api/admin/series", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
          body: JSON.stringify({
            id: seriesId,
            title: form.title,
            slug: form.slug,
            description: form.description,
            photoIds,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setMessage({ type: "error", text: data.error || "Failed to save" });
          setSaving(false);
          return;
        }
      }
      setMessage({ type: "success", text: "Saved" });
      setTimeout(onBack, 400);
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!seriesId) return;
    if (!window.confirm(`Delete series "${form.title}"? Photos themselves are not deleted.`)) return;
    setSaving(true);
    try {
      await fetch("/api/admin/series", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id: seriesId }),
      });
      onBack();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted py-12 text-center">Loading series…</div>
    );
  }

  return (
    <div>
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon size={20} /> Back
        </button>
        <h1 className="text-xl font-semibold flex-1">
          {isCreating ? "New Series" : `Edit: ${form.title}`}
        </h1>
        {!isCreating && form.slug && (
          <a
            href={`/photography/series/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowSquareOutIcon size={18} /> View
          </a>
        )}
        {!isCreating && (
          <button
            onClick={remove}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
          >
            <TrashIcon size={18} /> Delete
          </button>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <FloppyDiskIcon size={18} /> {saving ? "Saving..." : "Save"}
        </button>
      </header>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <SeriesMetaForm
        form={form}
        onTitleChange={changeTitle}
        onSlugChange={(v) => { setForm((f) => ({ ...f, slug: v })); setSlugManuallyEdited(true); }}
        onDescriptionChange={(v) => setForm((f) => ({ ...f, description: v }))}
      />

      <SeriesPhotoList
        photoIds={photoIds}
        photosById={photosById}
        onMove={move}
        onRemove={(id) => setPhotoIds((ids) => ids.filter((x) => x !== id))}
      />

      <SeriesPhotoPicker
        photos={availablePhotos}
        onAdd={(id) => setPhotoIds((ids) => [...ids, id])}
      />
    </div>
  );
}

function SeriesMetaForm({
  form, onTitleChange, onSlugChange, onDescriptionChange,
}: {
  form: Form;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted dark:text-muted-dark">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
          placeholder="Tesla"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted dark:text-muted-dark">
          Slug — visible at <code className="font-mono">photos.borisnezlobin.com/{form.slug || "your-slug"}</code>
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono text-sm"
          placeholder="tesla"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted dark:text-muted-dark">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
          placeholder="Three days with the only car I've ever wanted to own..."
        />
      </div>
    </div>
  );
}

function SeriesPhotoList({
  photoIds, photosById, onMove, onRemove,
}: {
  photoIds: string[];
  photosById: Map<string, Photo>;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted dark:text-muted-dark uppercase tracking-widest mb-3">
        Photos in order ({photoIds.length})
      </h2>
      {photoIds.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded">
          Add photos from the library below to get started.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {photoIds.map((id, i) => {
            const photo = photosById.get(id);
            return (
              <li
                key={id}
                className="flex items-center gap-3 p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800"
              >
                <span className="w-6 text-right text-xs text-muted font-mono">{String(i + 1).padStart(2, "0")}</span>
                {photo ? (
                  <img src={photo.thumbUrl} alt={photo.title} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-neutral-200 dark:bg-neutral-800" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{photo?.title ?? "Missing photo"}</div>
                </div>
                <button
                  onClick={() => onMove(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                  aria-label="Move up"
                >
                  <ArrowUpIcon size={16} />
                </button>
                <button
                  onClick={() => onMove(i, 1)}
                  disabled={i === photoIds.length - 1}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                  aria-label="Move down"
                >
                  <ArrowDownIcon size={16} />
                </button>
                <button
                  onClick={() => onRemove(id)}
                  className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Remove"
                >
                  <XIcon size={16} />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function SeriesPhotoPicker({
  photos, onAdd,
}: {
  photos: Photo[];
  onAdd: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted dark:text-muted-dark uppercase tracking-widest mb-3">
        Library ({photos.length}) — click to add
      </h2>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">All photos are in this series.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => onAdd(p.id)}
              className="group relative aspect-square rounded overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-500 transition-colors"
              title={p.title}
            >
              <img src={p.thumbUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <PlusIcon size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
