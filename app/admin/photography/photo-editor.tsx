"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CircleIcon,
  FloppyDiskIcon,
  ImageSquareIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { compressImageIfLarge, formatBytes } from "./compress-image";
import type { Category, Message, Photo } from "./types";

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fileBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export default function PhotoEditor({
  photo,
  isCreating,
  password,
  categories,
  onBack,
  onSaved,
}: {
  photo: Photo | null;
  isCreating: boolean;
  password: string;
  categories: Category[];
  onBack: () => void;
  onSaved: (p: Photo) => void;
}) {
  const [title, setTitle] = useState(photo?.title ?? "");
  const [description, setDescription] = useState(photo?.description ?? "");
  const [slug, setSlug] = useState(photo?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isCreating);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(photo?.image ?? null);
  const [date, setDate] = useState(
    photo?.takenAt
      ? photo.takenAt.split("T")[0]
      : isCreating
      ? new Date().toISOString().split("T")[0]
      : "",
  );
  const [camera, setCamera] = useState(photo?.camera ?? "");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(photo?.categorySlugs ?? []),
  );
  const [inGallery, setInGallery] = useState(photo?.inGallery ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  function changeTitle(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) setSlug(titleToSlug(value));
  }

  function selectImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (isCreating && !title) {
      changeTitle(fileBaseName(file.name).replace(/[-_]+/g, " "));
    }
  }

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function save() {
    if (!title || !slug) {
      setMessage({ type: "error", text: "Title and slug are required" });
      return;
    }
    if (isCreating && !imageFile) {
      setMessage({ type: "error", text: "Image is required for new photos" });
      return;
    }

    setSaving(true);
    setMessage(null);

    let uploadFile = imageFile;
    if (uploadFile) {
      try {
        setMessage({ type: "success", text: "Preparing image…" });
        const result = await compressImageIfLarge(uploadFile);
        if (result.compressed) {
          console.info(`Compressed ${formatBytes(uploadFile.size)} → ${formatBytes(result.file.size)}`);
        }
        uploadFile = result.file;
      } catch (e) {
        console.error("Image compression failed; uploading original:", e);
      }
    }

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("slug", slug);
    if (date) form.append("takenAt", date);
    if (camera) form.append("camera", camera);
    form.append("categories", JSON.stringify(Array.from(selectedCategories)));
    form.append("inGallery", inGallery ? "true" : "false");
    if (uploadFile) form.append("image", uploadFile);
    if (!isCreating) form.append("id", photo!.id);

    try {
      setMessage({ type: "success", text: "Uploading…" });
      const res = await fetch("/api/admin/photography", {
        method: isCreating ? "POST" : "PUT",
        headers: { Authorization: `Bearer ${password}` },
        body: form,
      });
      // The body limit error returns HTML, not JSON, so guard the parse.
      let data: { success?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (res.ok && data.success) {
        setMessage({ type: "success", text: isCreating ? "Photo created" : "Photo updated" });
        if (data && (data as any).photo) onSaved((data as any).photo);
      } else if (res.status === 413) {
        setMessage({
          type: "error",
          text: `Image too large (${uploadFile ? formatBytes(uploadFile.size) : "?"} after compression). Try a smaller source file.`,
        });
      } else {
        setMessage({ type: "error", text: data.error || `Failed to save (${res.status})` });
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!photo) return;
    if (!window.confirm(`Delete "${photo.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/photography", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ id: photo.id }),
      });
      const data = await res.json();
      if (data.success) onBack();
      else setMessage({ type: "error", text: data.error || "Failed to delete" });
    } catch {
      setMessage({ type: "error", text: "Failed to delete" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <EditorHeader
          title={isCreating ? "New Photo" : `Edit: ${photo!.title}`}
          saving={saving}
          showDelete={!isCreating}
          onBack={onBack}
          onSave={save}
          onDelete={remove}
        />
        {message && <MessageBanner message={message} />}
        <div className="flex flex-col gap-6">
          <ImageDrop preview={imagePreview} onSelect={selectImage} />
          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => changeTitle(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Golden Gate at Sunset"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Shot on iPhone 16 Pro with a 5s exposure..."
            />
          </Field>
          <CategoryPicker
            categories={categories}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Slug">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono text-sm"
                placeholder="golden-gate-at-sunset"
              />
            </Field>
            <Field label="Camera">
              <input
                type="text"
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400 text-sm"
                placeholder="Sony a6700"
              />
            </Field>
            <Field label="Date taken">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded border border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="font-medium">
                {inGallery ? "Visible on /photography" : "Hidden from /photography"}
              </div>
              <p className="text-sm text-muted dark:text-muted-dark mt-1">
                {"When hidden, this photo still appears in any series it belongs to and still feeds the mosaic tile pool — it just won't show on the main canvas or grid."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInGallery((v) => !v)}
              role="switch"
              aria-checked={inGallery}
              aria-label="Toggle gallery visibility"
              className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
                inGallery ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white dark:bg-neutral-900 shadow transition-[left] duration-200"
                style={{ left: inGallery ? 24 : 4 }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorHeader({
  title, saving, showDelete, onBack, onSave, onDelete,
}: {
  title: string;
  saving: boolean;
  showDelete: boolean;
  onBack: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted hover:text-black dark:hover:text-white transition-colors"
      >
        <ArrowLeftIcon size={20} />
        Back
      </button>
      <h1 className="text-xl font-semibold flex-1">{title}</h1>
      {showDelete && (
        <button
          onClick={onDelete}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
        >
          <TrashIcon size={18} />
          Delete
        </button>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <FloppyDiskIcon size={18} />
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function MessageBanner({ message }: { message: Message }) {
  return (
    <div
      className={`mb-4 p-3 rounded text-sm ${
        message.type === "success"
          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
      }`}
    >
      {message.text}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-muted dark:text-muted-dark">{label}</label>
      {children}
    </div>
  );
}

function ImageDrop({ preview, onSelect }: { preview: string | null; onSelect: (f: File) => void }) {
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-neutral-500");
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove("border-neutral-500")}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-neutral-500");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) onSelect(file);
      }}
      className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors overflow-hidden"
    >
      {preview ? (
        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted dark:text-muted-dark">
          <ImageSquareIcon size={48} />
          <span className="text-sm">Drop an image or click to upload</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}

function CategoryPicker({
  categories, selected, onToggle,
}: {
  categories: Category[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-muted dark:text-muted-dark">Categories</label>
      {categories.length === 0 ? (
        <p className="text-xs text-muted">
          No categories yet. Create some on the Categories tab.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selected.has(cat.slug);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggle(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
                    : "bg-transparent border-neutral-300 dark:border-neutral-700 hover:border-neutral-500"
                }`}
              >
                {isSelected ? <CheckCircleIcon size={14} weight="fill" /> : <CircleIcon size={14} />}
                {cat.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
