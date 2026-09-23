"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Photo } from "./types";
import { useAdminAuth } from "../components/admin-auth";

export type AdminFetchState = {
  photos: Photo[];
  categories: Category[];
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useAdminFetch(): AdminFetchState {
  const { adminFetch } = useAdminAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [photosRes, catsRes] = await Promise.all([
        adminFetch("/api/admin/photography"),
        adminFetch("/api/admin/categories"),
      ]);
      if (photosRes.status === 401 || catsRes.status === 401) return;
      const photoData = await photosRes.json();
      const catData = await catsRes.json();
      setPhotos(photoData.photos || []);
      setCategories(catData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { photos, categories, loading, refetch };
}
