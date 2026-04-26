"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Photo } from "./types";

export type AdminFetchState = {
  photos: Photo[];
  categories: Category[];
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useAdminFetch(password: string, isAuthed: boolean, onUnauthed: () => void): AdminFetchState {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const [photosRes, catsRes] = await Promise.all([
        fetch("/api/admin/photography", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${password}` } }),
      ]);
      if (photosRes.status === 401 || catsRes.status === 401) {
        onUnauthed();
        return;
      }
      const photoData = await photosRes.json();
      const catData = await catsRes.json();
      setPhotos(photoData.photos || []);
      setCategories(catData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [password, onUnauthed]);

  useEffect(() => {
    if (isAuthed) refetch();
  }, [isAuthed, refetch]);

  return { photos, categories, loading, refetch };
}
