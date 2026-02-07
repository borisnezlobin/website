"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  FloppyDisk,
  CaretRight,
  Trash,
  Plus,
  ImageSquare,
} from "@phosphor-icons/react";

type Photo = {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
  likes: number;
  createdAt: string;
};

type Message = { type: "success" | "error"; text: string };

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PhotographyAdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin_password");
    if (stored) {
      setPassword(stored);
      setIsAuthed(true);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/photography", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) {
        setIsAuthed(false);
        localStorage.removeItem("admin_password");
        return;
      }
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (isAuthed) fetchPhotos();
  }, [isAuthed, fetchPhotos]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setSlug("");
    setSlugManuallyEdited(false);
    setImageFile(null);
    setImagePreview(null);
    setDate("");
    setMessage(null);
  }

  function openCreate() {
    resetForm();
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedPhoto(null);
    setIsCreating(true);
  }

  function openEdit(photo: Photo) {
    resetForm();
    setTitle(photo.title);
    setDescription(photo.description);
    setSlug(photo.slug);
    setSlugManuallyEdited(true);
    setImagePreview(photo.image);
    setDate(new Date(photo.createdAt).toISOString().split("T")[0]);
    setSelectedPhoto(photo);
    setIsCreating(false);
  }

  function goBack() {
    setSelectedPhoto(null);
    setIsCreating(false);
    resetForm();
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(titleToSlug(value));
    }
  }

  function handleImageSelect(file: File) {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function handleSave() {
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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("slug", slug);
    if (date) formData.append("createdAt", date);
    if (imageFile) formData.append("image", imageFile);

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/photography", {
          method: "POST",
          headers: { Authorization: `Bearer ${password}` },
          body: formData,
        });
      } else {
        formData.append("id", selectedPhoto!.id);
        res = await fetch("/api/admin/photography", {
          method: "PUT",
          headers: { Authorization: `Bearer ${password}` },
          body: formData,
        });
      }

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: isCreating ? "Photo created" : "Photo updated" });
        fetchPhotos();
        if (isCreating) {
          setSelectedPhoto(data.photo);
          setIsCreating(false);
          setImagePreview(data.photo.image);
          setSlugManuallyEdited(true);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedPhoto) return;
    if (!window.confirm(`Delete "${selectedPhoto.title}"? This cannot be undone.`)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/photography", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ id: selectedPhoto.id }),
      });
      const data = await res.json();
      if (data.success) {
        goBack();
        fetchPhotos();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete" });
    } finally {
      setSaving(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("admin_password", password);
    setIsAuthed(true);
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-80">
          <h1 className="text-xl font-semibold text-center">Photography Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (selectedPhoto || isCreating) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-muted hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-xl font-semibold flex-1">
              {isCreating ? "New Photo" : `Edit: ${selectedPhoto!.title}`}
            </h1>
            {!isCreating && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
              >
                <Trash size={18} />
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <FloppyDisk size={18} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

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

          <div className="flex flex-col gap-6">
            <label
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-neutral-500"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-neutral-500"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-neutral-500");
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) handleImageSelect(file);
              }}
              className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted dark:text-muted-dark">
                  <ImageSquare size={48} />
                  <span className="text-sm">Drop an image or click to upload</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </label>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted dark:text-muted-dark">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                placeholder="Golden Gate at Sunset"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted dark:text-muted-dark">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
                placeholder="Shot on iPhone 16 Pro with a 5s exposure..."
              />
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm text-muted dark:text-muted-dark">Slug</label>
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
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted dark:text-muted-dark">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Photography Admin</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              Add Photo
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("admin_password");
                setIsAuthed(false);
                setPassword("");
              }}
              className="text-sm text-muted hover:text-black dark:hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 text-muted dark:text-muted-dark">
            <ImageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No photos yet. Add your first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => openEdit(photo)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left"
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{photo.title}</div>
                  <div className="text-sm text-muted truncate">
                    {photo.description || "No description"}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(photo.createdAt).toLocaleDateString()} · {photo.likes} likes
                  </div>
                </div>
                <CaretRight size={20} className="text-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
