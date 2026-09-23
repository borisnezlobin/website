"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminResumeDetail, AdminResumeRow } from "@/app/lib/resume/types";
import { useAdminAuth } from "../components/admin-auth";
import { describeFailedResponse } from "./format";

export const RESUME_ADMIN_ENDPOINT = "/api/admin/resume";

export type Loadable<T> =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; value: T };

function describeThrown(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be sent.";
}

function useAdminJson<T>(path: string, pick: (body: unknown) => T) {
  const { adminFetch } = useAdminAuth();
  const [result, setResult] = useState<Loadable<T>>({ state: "loading" });

  const load = useCallback(async () => {
    setResult({ state: "loading" });
    try {
      const res = await adminFetch(path);
      if (!res.ok) {
        setResult({ state: "error", message: await describeFailedResponse(res) });
        return;
      }
      setResult({ state: "ready", value: pick(await res.json()) });
    } catch (error) {
      setResult({ state: "error", message: describeThrown(error) });
    }
    // `pick` is a module-level selector, so it never changes between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  return { result, setResult, reload: load };
}

const pickRows = (body: unknown) => ((body as { rows?: AdminResumeRow[] })?.rows ?? []);
const pickDetail = (body: unknown) => (body as { detail: AdminResumeDetail }).detail;

export function useResumeRows() {
  return useAdminJson(RESUME_ADMIN_ENDPOINT, pickRows);
}

export function useResumeDetail(id: string) {
  return useAdminJson(`${RESUME_ADMIN_ENDPOINT}?id=${encodeURIComponent(id)}`, pickDetail);
}

export function useDeleteSlug() {
  const { adminFetch } = useAdminAuth();

  return useCallback(
    async (slug: string): Promise<string | null> => {
      try {
        const res = await adminFetch(`${RESUME_ADMIN_ENDPOINT}?slug=${encodeURIComponent(slug)}`, {
          method: "DELETE",
        });
        if (!res.ok) return await describeFailedResponse(res);
        const body = await res.json();
        return body?.ok === true ? null : "The server did not confirm the delete.";
      } catch (error) {
        return describeThrown(error);
      }
    },
    [adminFetch],
  );
}

export function withoutSlug<T extends AdminResumeRow>(row: T): T {
  return { ...row, slug: null, pdfUrl: null };
}
