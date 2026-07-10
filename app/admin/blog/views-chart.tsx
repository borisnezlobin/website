"use client";

import { useMemo, useState } from "react";
import { ChartBar } from "@phosphor-icons/react/dist/ssr";

export type ViewDay = { date: string; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function buildSeries(viewsByDay: ViewDay[], days: number) {
  const counts = new Map<string, number>();
  for (const v of viewsByDay) counts.set(dayKey(new Date(v.date)), v.count);

  const today = new Date();
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end - (days - 1 - i) * DAY_MS);
    return { date: d, count: counts.get(dayKey(d)) ?? 0 };
  });
}

const RANGES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export default function ViewsChart({
  viewsByDay,
  totalViews,
}: {
  viewsByDay: ViewDay[];
  totalViews: number;
}) {
  const [days, setDays] = useState(30);
  const [hover, setHover] = useState<number | null>(null);

  const series = useMemo(() => buildSeries(viewsByDay, days), [viewsByDay, days]);
  const max = Math.max(1, ...series.map((d) => d.count));
  const windowTotal = series.reduce((sum, d) => sum + d.count, 0);
  const hasData = viewsByDay.length > 0;

  const fmtDay = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="mb-6 p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <ChartBar size={20} className="text-muted flex-shrink-0" />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{totalViews.toLocaleString()}</span>
              <span className="text-sm text-muted">total views</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              {windowTotal.toLocaleString()} in the last {days} days
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                days === r.days
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-black"
                  : "text-muted hover:text-black dark:hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="relative h-28 flex items-end gap-px">
            {series.map((d, i) => (
              <div
                key={i}
                className="group relative flex-1 h-full flex items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`w-full rounded-sm transition-colors ${
                    d.count > 0
                      ? "bg-neutral-800 dark:bg-neutral-200 group-hover:bg-black dark:group-hover:bg-white"
                      : "bg-neutral-100 dark:bg-neutral-800"
                  }`}
                  style={{ height: d.count > 0 ? `${Math.max(6, (d.count / max) * 100)}%` : "3px" }}
                />
                {hover === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap px-2 py-1 rounded bg-neutral-900 dark:bg-white text-white dark:text-black text-xs shadow-lg">
                    <span className="font-semibold tabular-nums">{d.count}</span> view{d.count !== 1 && "s"} · {fmtDay(d.date)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted">
            <span>{fmtDay(series[0].date)}</span>
            <span>{fmtDay(series[series.length - 1].date)}</span>
          </div>
        </>
      ) : (
        <div className="h-28 flex flex-col items-center justify-center text-center gap-1 text-muted">
          <span className="text-sm">No views logged yet.</span>
          <span className="text-xs">Per-day tracking starts now — the graph fills in as people read.</span>
        </div>
      )}
    </div>
  );
}
