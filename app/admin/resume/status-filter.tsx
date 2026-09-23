import type { AdminResumeRow, ResumeStatus } from "@/app/lib/resume/types";
import { RESUME_STATUSES, RESUME_STATUS_PRESENTATION } from "./resume-status";

export type StatusFilterValue = ResumeStatus | "ALL";

type FilterOption = { value: StatusFilterValue; label: string; count: number };

function buildOptions(rows: AdminResumeRow[]): FilterOption[] {
  const statusOptions = RESUME_STATUSES.map((status) => ({
    value: status,
    label: RESUME_STATUS_PRESENTATION[status].label,
    count: rows.filter((row) => row.status === status).length,
  }));
  return [{ value: "ALL", label: "All", count: rows.length }, ...statusOptions];
}

const OPTION_BASE =
  "flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400";
const OPTION_SELECTED = "bg-white font-semibold text-light shadow-sm dark:bg-neutral-700 dark:text-dark";
const OPTION_IDLE = "text-muted hover:text-light dark:text-muted-dark dark:hover:text-dark";

export default function StatusFilter({
  rows,
  value,
  onChange,
}: {
  rows: AdminResumeRow[];
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-1 rounded-lg bg-neutral-200/60 p-1 dark:bg-neutral-800">
      <legend className="sr-only">Show requests with status</legend>
      {buildOptions(rows).map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`${OPTION_BASE} ${selected ? OPTION_SELECTED : OPTION_IDLE}`}
          >
            {option.label}
            <span className="tabular-nums text-muted dark:text-muted-dark">{option.count}</span>
          </button>
        );
      })}
    </fieldset>
  );
}

export function filterRows(rows: AdminResumeRow[], value: StatusFilterValue) {
  return value === "ALL" ? rows : rows.filter((row) => row.status === value);
}
