import type { TrekData } from "../lib/trek";
import { intComma } from "../lib/chart";

function Rule({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <code className="h-fit shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-light-foreground dark:bg-neutral-800 dark:text-dark-foreground">
        {code}
      </code>
      <span className="text-light-foreground dark:text-dark-foreground">{children}</span>
    </li>
  );
}

export function Methodology({ trek }: { trek: TrekData }) {
  const t = trek.totals;
  return (
    <div className="max-w-2xl">
      <p className="text-light-foreground dark:text-dark-foreground">
        Nobody had a real number, so I made one. Over four days on the Classic Inca Trail I walked
        with a notebook and tallied every staircase as I climbed or descended it — section by
        section, all the way from the Km&nbsp;82 trailhead to Machu Picchu. Afterwards I transcribed
        the notebook and parsed it into the {intComma(t.groupCount)} stair groups behind every number
        on this page.
      </p>
      <p className="mt-4 text-light-foreground dark:text-dark-foreground">
        Counting stone steps honestly is harder than it sounds, so the data keeps its doubts.
        Worn-down stairs that might not really be stairs are flagged as ambiguous — about{" "}
        {intComma(t.ambiguousStairs)} of them — and left out of the headline climb. Steps you can step
        around are marked avoidable. Where the trail splits, both sides are counted toward the total
        but only the shorter one toward the minimum. That is why there are two numbers: a full{" "}
        <strong className="font-semibold">{intComma(t.totalStairs)}</strong> that exist and a leaner{" "}
        <strong className="font-semibold">{intComma(t.minStairs)}</strong> you must actually take.
      </p>

      <h3 className="vectra mt-8 text-xl font-bold text-light-foreground dark:text-dark-foreground">
        How to read the notes
      </h3>
      <ul className="mt-4 space-y-2.5">
        <Rule code="21">21 steps up; a negative number means down</Rule>
        <Rule code="-3-1">3 steps down, 1 of which you can walk around</Rule>
        <Rule code="± 4">ambiguous — might not really count as a step</Rule>
        <Rule code="10/2">a fork: you take one side or the other</Rule>
        <Rule code="Dead Woman&apos;s Pass">words become a landmark on the trail</Rule>
      </ul>

      <h3 className="vectra mt-8 text-xl font-bold text-light-foreground dark:text-dark-foreground">
        Putting the steps on the real mountain
      </h3>
      <p className="mt-4 text-light-foreground dark:text-dark-foreground">
        Stairs alone don&apos;t tell you how high you are — most of the climbing happens on dirt
        grade between the staircases. So rather than guess, the profile is the real trail: a
        firsthand GPS track of all {trek.totalKm.toFixed(0)}&nbsp;km, sampled against 30-metre
        topographic data, so every elevation is accurate to the metre — from {intComma(
          trek.profile[0].elev,
        )}
        &nbsp;m at Km&nbsp;82 up to {intComma(trek.maxElev)}&nbsp;m at Dead Woman&apos;s Pass and down
        to Machu Picchu, gaining {intComma(trek.ascentM)}&nbsp;m and losing {intComma(trek.descentM)}
        &nbsp;m along the way. I then aligned my step counts to that track using the landmarks both
        share — the pass, the named ruins, the three camps — so each staircase lands at its real
        place on the mountain. The line is grey where you walk and red where the Incas built steps.
      </p>
      <p className="mt-4 text-sm text-muted dark:text-muted-dark">
        One surprise from the GPS: the trail is about {trek.totalKm.toFixed(0)}&nbsp;km, not the
        43&nbsp;km you&apos;ll see almost everywhere. A 6,000-point firsthand recording and the
        Ministry of Culture&apos;s own map agree — and so does my own &ldquo;halfway at the
        pass&rdquo; note.
      </p>
    </div>
  );
}
