import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

export function Methodology({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-light-foreground dark:text-dark-foreground">
      <p>
        There is no official count of the steps on the Inca Trail. Guidebooks promise
        &ldquo;thousands&rdquo; without saying how many. So for the four days from Km&nbsp;82 to
        Machu Picchu, I carried a notebook and tallied every staircase as I climbed or descended it.
        That came to {intComma(t.groupCount)} separate flights of stone steps. As far as I can tell,
        this is the only place where every step on the trail has been counted and put on a map.
      </p>
      <p>
        Counting stairs turns out to be a question of judgement. Is a knee-high block with a flat top
        a step? What about a shallow ramp of cobbles, or a single worn slab? I logged the clear ones
        and set the doubtful ones aside as &ldquo;maybe&rdquo; (there are about{" "}
        {intComma(t.ambiguousStairs)} of those). I also marked the steps you can walk around. Where
        the path forks, I counted both branches but only counted the shorter one toward the climb you
        can&rsquo;t avoid. That&rsquo;s why there are two numbers:{" "}
        <strong className="font-semibold">{intComma(t.totalStairs)}</strong> steps physically exist,
        but you only have to take{" "}
        <strong className="font-semibold">{intComma(t.minStairs)}</strong> of them.
      </p>
      <p>
        Real hikers climb a number somewhere in between. Nobody walks around every avoidable step,
        but nobody treats every &ldquo;maybe&rdquo; as a stair either. If you walk around a quarter
        of the avoidable steps and count half of the doubtful ones, you take between{" "}
        <strong className="font-semibold">{intComma(t.expectedLow)}</strong> and{" "}
        <strong className="font-semibold">{intComma(t.expectedHigh)}</strong> steps. Where you fall in
        that range depends on which side of each fork you walk.
      </p>
      <p>
        The elevation profile comes from a GPS recording I made of the whole{" "}
        {trek.totalKm.toFixed(0)}-kilometre route. I sampled it against 30-metre topographic data (a
        satellite map of ground height in 30-metre squares) and pinned it to the known heights of the
        pass, the ruins and the three camps. That makes it accurate to within a few metres. I placed
        the steps on that line by steepness, because the Incas cut steps where the ground was too
        steep to walk. Grey is dirt path; red is stone stairs.
      </p>
      <p>
        The GPS also settled an old argument about distance. Almost everyone describes the Classic
        Inca Trail as 43&nbsp;km, but my 6,000-point recording puts it closer to{" "}
        <strong className="font-semibold">{trek.totalKm.toFixed(0)}&nbsp;km</strong>. The Peruvian
        Ministry of Culture&rsquo;s own map agrees with it. So does the fact that Dead Woman&rsquo;s
        Pass sits at the halfway mark.
      </p>
    </div>
  );
}
