import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="text-3xl font-bold tabular-nums md:text-4xl">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {sub && <div className="text-sm text-muted dark:text-muted-dark">{sub}</div>}
    </div>
  );
}

export function Hero({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  const percentUp = (trek.ascentM / (trek.ascentM + trek.descentM)) * 100;

  return (
    <header>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-[1.75rem] font-bold text-[#191919] md:text-2xl md:font-normal dark:text-[#fafafa]">
          How many steps are on the Inca Trail?
        </h1>
        <p className="mt-2 text-muted italic dark:text-muted-dark">
          Hand-counted over four days and {trek.totalKm.toFixed(0)} km
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-4 text-light-foreground dark:text-dark-foreground">
        <p>
          There has never been an accurate count of steps built by the Incas on the Inca Trail,
          despite dozens of travel agencies throwing out approximate estimates, until now.
        </p>
        <p>
          I counted—by hand!—every single stair, step, and staircase on the four-day Inca Trail from
          Km 82 to Machu Picchu and kept track of which steps were ambiguous or optional. In places
          where the trail split, I counted both forks.
        </p>
        <p>
          To finally answer the question, there are{" "}
          <strong className="font-semibold">{intComma(t.totalStairs)} stone steps</strong> on the
          four-day Inca Trail, of which you must climb{" "}
          <strong className="font-semibold">at least {intComma(t.minStairs)}</strong>. In practice,
          most hikers actually take somewhere between{" "}
          <strong className="font-semibold">
            {intComma(t.expectedLow)} and {intComma(t.expectedHigh)}
          </strong>
          .
        </p>
      </div>

      <div className="mt-9 flex flex-row flex-wrap items-start justify-center gap-x-16 gap-y-6">
        <Stat value={intComma(t.totalStairs)} label="Total steps" />
        <Stat
          value={`${intComma(t.expectedLow)}–${intComma(t.expectedHigh)}`}
          label="Likely taken"
        />
        <Stat value={intComma(t.minStairs)} label="Minimum required" />
      </div>
    </header>
  );
}
