"use client";

import { useState } from "react";
import { FileDashedIcon } from "@phosphor-icons/react/dist/ssr";
import type { AdminResumeRow } from "@/app/lib/resume/types";
import LoadProblem from "./load-problem";
import ResumeDetail from "./resume-detail";
import ResumeTable from "./resume-table";
import StatusFilter, { filterRows, type StatusFilterValue } from "./status-filter";
import { useResumeRows, withoutSlug } from "./use-resume-requests";

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-lg bg-white px-4 py-16 text-center shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <FileDashedIcon size={32} className="text-muted dark:text-muted-dark" aria-hidden />
      <p className="text-sm text-muted dark:text-muted-dark">
        {filtered
          ? "No requests have this status. Pick another filter to see the rest."
          : "Nobody has asked for a resume yet. Requests from /resume appear here as they come in."}
      </p>
    </section>
  );
}

function RequestList({
  rows,
  filter,
  onFilterChange,
  onOpen,
}: {
  rows: AdminResumeRow[];
  filter: StatusFilterValue;
  onFilterChange: (value: StatusFilterValue) => void;
  onOpen: (id: string) => void;
}) {
  const visibleRows = filterRows(rows, filter);
  return (
    <>
      {rows.length > 0 && <StatusFilter rows={rows} value={filter} onChange={onFilterChange} />}
      {visibleRows.length === 0 ? (
        <EmptyState filtered={rows.length > 0} />
      ) : (
        <ResumeTable rows={visibleRows} onOpen={onOpen} />
      )}
    </>
  );
}

export default function ResumeAdminPage() {
  const { result, setResult, reload } = useResumeRows();
  const [filter, setFilter] = useState<StatusFilterValue>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  function markSlugDeleted(id: string) {
    if (result.state !== "ready") return;
    const rows = result.value.map((row) => (row.id === id ? withoutSlug(row) : row));
    setResult({ state: "ready", value: rows });
  }

  if (openId) {
    return (
      <span className="mx-auto flex w-full max-w-5xl flex-col">
        <ResumeDetail id={openId} onBack={() => setOpenId(null)} onSlugDeleted={markSlugDeleted} />
      </span>
    );
  }

  return (
    <span className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Resume requests</h1>
      {result.state === "loading" && <p className="text-sm text-muted dark:text-muted-dark">Loading requests…</p>}
      {result.state === "error" && <LoadProblem message={result.message} onRetry={reload} />}
      {result.state === "ready" && (
        <RequestList rows={result.value} filter={filter} onFilterChange={setFilter} onOpen={setOpenId} />
      )}
    </span>
  );
}
