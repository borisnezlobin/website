import type { Totals } from "../lib/totals";
import { intComma } from "../lib/chart";

// The ± "maybe" steps, written for someone who's actually going to walk the
// trail: what these in-between steps feel like underfoot, and why they don't
// really change the number you'll climb.

export function AmbiguousBreakdown({ totals }: { totals: Totals }) {
  return (
    <div className="mx-auto mt-8 max-w-2xl text-light-foreground dark:text-dark-foreground">
      <p>
        Not every step is a clean yes-or-no. Around{" "}
        <strong className="font-semibold">{intComma(totals.ambiguousStairs)}</strong> of them I
        couldn&apos;t quite call: a barely-there rise that might be a stair or might just be the path
        tilting, a shallow ramp, a worn-down slab, or a little half-step carved into the face of a
        bigger stone. Walking it, you&apos;ll stride over most of these without a second thought. I
        kept them out of the headline counts so those stay honest, and counted each as half a step in
        the &ldquo;likely taken&rdquo; range — next to the thousands you&apos;ll climb, they barely
        move the needle.
      </p>
    </div>
  );
}
