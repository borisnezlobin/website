import type { DayTotals } from "../lib/trek";
import { intComma } from "../lib/chart";

// Steps per day as a simple bar graph. Each bar is scaled against the biggest
// day, so the long descent of Day Three reads at a glance, and split into the
// stairs you climb versus the ones you drop.

const CLIMB = "bg-[color:var(--primary)]";
const DESCEND = "bg-slate-500 dark:bg-slate-400";

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

export function DayBreakdown({ days }: { days: DayTotals[] }) {
  const max = Math.max(...days.map((d) => d.totals.totalStairs), 1);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted dark:text-muted-dark">
        <Swatch className={CLIMB} label="climbed" />
        <Swatch className={DESCEND} label="descended" />
      </div>

      <div className="space-y-6">
        {days.map((d) => {
          const t = d.totals;
          const barWidth = (t.totalStairs / max) * 100;
          const climbPct = t.totalStairs ? (t.upTotal / t.totalStairs) * 100 : 0;
          return (
            <div key={d.name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-light-foreground dark:text-dark-foreground">
                  {d.name}
                </span>
                <span className="tabular-nums text-light-foreground dark:text-dark-foreground">
                  {intComma(t.totalStairs)} steps
                </span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="flex h-full" style={{ width: `${barWidth}%` }}>
                  <div className={`h-full ${CLIMB}`} style={{ width: `${climbPct}%` }} />
                  <div className={`h-full ${DESCEND}`} style={{ width: `${100 - climbPct}%` }} />
                </div>
              </div>
              <div className="mt-1.5 text-sm tabular-nums text-muted dark:text-muted-dark">
                {intComma(t.upTotal)} climbed · {intComma(t.downTotal)} descended · ±
                {intComma(t.ambiguousStairs)} maybe
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
