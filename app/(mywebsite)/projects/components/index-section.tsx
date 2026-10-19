import type { ReactNode } from "react";
import type { ProjectClaim } from "../content/types";

/** One claim from the hero, as the heading over its projects. The hero's claim links land here. */
export function IndexSection({ claim, children }: { claim: ProjectClaim; children: ReactNode }) {
    const titleId = `${claim.id}-title`;
    return (
        <section id={claim.id} aria-labelledby={titleId} className="scroll-mt-20 pt-16 first:pt-0 md:pt-20">
            <h2 id={titleId} className="mb-3 text-2xl md:mb-4 md:text-3xl">
                {claim.verb} {claim.noun}
                <span className="text-primary">.</span>
            </h2>
            <ul className="flex flex-col gap-1 ps-4 md:ps-8">{children}</ul>
        </section>
    );
}
