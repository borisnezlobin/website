"use client";

import { useCallback, useEffect, useState } from "react";
import type { SeriesSummary } from "@/app/lib/photo-types";
import SeriesEditor from "./series-editor";
import SeriesList from "./series-list";
import type { Photo } from "./types";
import { useAdminAuth } from "../components/admin-auth";

type EditState = "list" | { mode: "new" } | { mode: "edit"; slug: string };

export default function SeriesManager({
  photos,
}: {
  photos: Photo[];
}) {
  const { adminFetch } = useAdminAuth();
  const [list, setList] = useState<SeriesSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<EditState>("list");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/series");
      const data = await res.json();
      setList(data.series ?? []);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (view !== "list") {
    return (
      <SeriesEditor
        slug={view.mode === "edit" ? view.slug : null}
        photos={photos}
        onBack={() => {
          setView("list");
          fetchList();
        }}
      />
    );
  }

  return (
    <SeriesList
      series={list}
      loading={loading}
      onCreate={() => setView({ mode: "new" })}
      onEdit={(slug) => setView({ mode: "edit", slug })}
    />
  );
}
