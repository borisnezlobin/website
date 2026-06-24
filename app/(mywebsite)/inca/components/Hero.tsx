import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

// A single big stat.
function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="vectra text-3xl font-bold tabular-nums  md:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium ">
        {label}
      </div>
      {sub && <div className="text-sm text-muted dark:text-muted-dark">{sub}</div>}
    </div>
  );
}

export function Hero({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  const percentUp = (trek.ascentM / (trek.ascentM + trek.descentM) * 100);

  return (
    <header className="">
      <h1 className="mt-3 text-4xl md:text-5xl">
        How many steps are on the Inca Trail?
      </h1>
      <p className="text-sm text-muted dark:text-muted-dark">
        Hand-counted over four days and {trek.totalKm.toFixed(0)} km
      </p>
      <p className="mt-5 max-w-3xl mx-auto">
        There has never been an accurate count of steps built by the Incas on the Inca Trail, despite dozens of travel agencies throwing out approximate estimates, until now.<br /><br />
        
        I counted—by hand!—every single stair, step, and staircase on the four-day Inca Trail from Km 82 to Machu Picchu and kept
        track of which steps were ambiguous or optional. In places where the trail split, I counted both forks.<br /><br />
        
        To finally answer the question, there are <strong className="font-semibold">{intComma(t.totalStairs)} stone steps</strong> on the four-day Inca Trail,
        of which you must climb{" "}
        <strong className="font-semibold">at least {intComma(t.minStairs)}</strong>.<br /><br />
      </p>

      <div className="mt-9 flex flex-row flex-wrap items-start justify-around gap-x-4">
        <Stat value={intComma(t.totalStairs)} label="Total steps" sub="" />
        <Stat value={intComma(t.minStairs)} label="Minimum required" sub="" />
        <Stat
          value={`${intComma(trek.ascentM + trek.descentM)} m`}
          label="Total elevation change"
          sub={`${percentUp.toFixed(0)}% up and ${(100 - percentUp).toFixed(0)}% down`}
        />
      </div>
    </header>
  );
}
