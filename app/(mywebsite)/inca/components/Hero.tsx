import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

// A single big stat.
function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="vectra text-3xl font-bold tabular-nums text-light-foreground dark:text-dark-foreground md:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-light-foreground dark:text-dark-foreground">
        {label}
      </div>
      {sub && <div className="text-sm text-muted dark:text-muted-dark">{sub}</div>}
    </div>
  );
}

export function Hero({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  return (
    <header className="max-w-2xl">
      <p className="text-sm text-muted dark:text-muted-dark">
        A hand count · 4 days · {trek.totalKm.toFixed(0)} km · Km 82 to Machu Picchu
      </p>
      <h1 className="vectra mt-3 text-4xl font-bold leading-tight text-light-foreground dark:text-dark-foreground md:text-5xl">
        How many steps are on the Inca Trail?
      </h1>
      <p className="mt-5 text-lg text-light-foreground dark:text-dark-foreground md:text-xl">
        I walked it with a notebook and counted every staircase. From the Km 82 trailhead to
        Machu Picchu there are about{" "}
        <strong className="font-semibold">{intComma(t.totalStairs)} stone steps</strong> — and you
        have to climb at least <strong className="font-semibold">{intComma(t.minStairs)}</strong> of
        them.
      </p>

      <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
        <Stat value={intComma(t.totalStairs)} label="steps in total" sub="every step that exists" />
        <Stat value={intComma(t.minStairs)} label="you must climb" sub="shortest route, ± skipped" />
        <Stat value={`${intComma(trek.maxElev)} m`} label="highest point" sub="Dead Woman's Pass" />
        <Stat
          value={`${intComma(trek.ascentM)} m`}
          label="total climbing"
          sub={`${intComma(trek.descentM)} m of descent`}
        />
      </div>
    </header>
  );
}
