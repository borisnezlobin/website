"use client";

import { useState } from "react";
import { FileDashedIcon } from "@phosphor-icons/react/dist/ssr";
import type { AdminResumeRow, ResumeStatus } from "@/app/lib/resume/types";
import DeleteStatusControl from "./delete-status-control";
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

const BULK_DELETABLE: StatusFilterValue[] = ["FAILED", "DECLINED"];

function RequestList({
  rows,
  filter,
  onFilterChange,
  onOpen,
  onRowDeleted,
  onStatusDeleted,
}: {
  rows: AdminResumeRow[];
  filter: StatusFilterValue;
  onFilterChange: (value: StatusFilterValue) => void;
  onOpen: (id: string) => void;
  onRowDeleted: (id: string) => void;
  onStatusDeleted: (status: ResumeStatus) => void;
}) {
  const visibleRows = filterRows(rows, filter);
  const bulkStatus = BULK_DELETABLE.includes(filter) && visibleRows.length > 0 ? (filter as ResumeStatus) : null;

  return (
    <>
      {rows.length > 0 && (
        <span className="flex flex-wrap items-start justify-between gap-3">
          <StatusFilter rows={rows} value={filter} onChange={onFilterChange} />
          {bulkStatus && (
            <DeleteStatusControl
              status={bulkStatus}
              count={visibleRows.length}
              onDeleted={() => onStatusDeleted(bulkStatus)}
            />
          )}
        </span>
      )}
      {visibleRows.length === 0 ? (
        <EmptyState filtered={rows.length > 0} />
      ) : (
        <ResumeTable rows={visibleRows} onOpen={onOpen} onDeleted={onRowDeleted} />
      )}
    </>
  );
}

export default function ResumeAdminPage() {
  const { result, setResult, reload } = useResumeRows();
  const [filter, setFilter] = useState<StatusFilterValue>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  function replaceRows(next: (rows: AdminResumeRow[]) => AdminResumeRow[]) {
    if (result.state !== "ready") return;
    setResult({ state: "ready", value: next(result.value) });
  }

  function markSlugDeleted(id: string) {
    replaceRows((rows) => rows.map((row) => (row.id === id ? withoutSlug(row) : row)));
  }

  function removeRow(id: string) {
    replaceRows((rows) => rows.filter((row) => row.id !== id));
  }

  function removeStatus(status: ResumeStatus) {
    replaceRows((rows) => rows.filter((row) => row.status !== status));
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
        <RequestList
          rows={result.value}
          filter={filter}
          onFilterChange={setFilter}
          onOpen={setOpenId}
          onRowDeleted={removeRow}
          onStatusDeleted={removeStatus}
        />
      )}
    </span>
  );
}
