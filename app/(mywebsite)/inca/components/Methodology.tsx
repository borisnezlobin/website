import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

export function Methodology({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  return (
    <div className="max-w-2xl space-y-4 text-light-foreground dark:text-dark-foreground">
      <p>
        There is no official count of the steps on the Inca Trail. Guidebooks promise
        &ldquo;thousands&rdquo;; none of them say how many. So over the four days from Km&nbsp;82 to
        Machu Picchu I carried a notebook and tallied every staircase as I climbed or descended it —
        {" "}
        {intComma(t.groupCount)} separate flights of stone in all. As far as I can tell, this is the
        only place every step on the trail has been counted and put on a map.
      </p>
      <p>
        Counting stairs turns out to be a question of judgement. Is a knee-high block with a flat top
        a step? A shallow ramp of cobbles? A single worn slab? I logged the clear ones, set the
        doubtful ones aside as &ldquo;maybe&rdquo; (about {intComma(t.ambiguousStairs)} of them), and
        marked the steps you can skirt around. Where the path forks, I counted both branches but
        charged only the shorter one to the climb you can&apos;t avoid. That is why there are two
        numbers: the <strong className="font-semibold">{intComma(t.totalStairs)}</strong> steps that
        physically exist, and the <strong className="font-semibold">{intComma(t.minStairs)}</strong>{" "}
        you actually have to take.
      </p>
      <p>
        To put all those steps on the real mountain, the profile is built from a firsthand GPS
        recording of the whole {trek.totalKm.toFixed(0)}-kilometre route, sampled against 30-metre
        topographic data and pinned to the known heights of the pass, the ruins and the three camps —
        accurate to within a few metres. The steps are then laid onto the line by steepness, because
        that is where the Incas cut them: on the grades too steep to simply walk. Grey is dirt path;
        red is stone stairs.
      </p>
      <p>
        The GPS also settled an old myth. The Classic Inca Trail is described almost everywhere as
        43&nbsp;km. It isn&apos;t: a 6,000-point recording, the Peruvian Ministry of Culture&apos;s
        own map, and the simple fact that Dead Woman&apos;s Pass falls at the halfway mark all put it
        closer to <strong className="font-semibold">{trek.totalKm.toFixed(0)}&nbsp;km</strong>.
      </p>
    </div>
  );
}
