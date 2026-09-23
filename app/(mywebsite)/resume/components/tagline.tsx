"use client";

import { withArticle } from "@/app/lib/resume/tagline/article";
import { LIKES, ROLES } from "@/app/lib/resume/tagline/phrases";
import { useCyclingIndex } from "../lib/use-cycling-index";
import { useTaglinePrediction } from "../lib/use-tagline-prediction";
import { RollingSlot } from "./rolling-slot";

const ROLE_PHRASES = ROLES.map(withArticle);
const LIKE_PHRASES = LIKES.map((like) => `${like}.`);

const ROLE_PERIOD_MS = 2800;
const LIKE_PERIOD_MS = 3700;
const LIKE_OFFSET_MS = 1500;

export function Tagline({ draft }: { draft: string }) {
    const snapped = useTaglinePrediction(draft);
    const idleRole = useCyclingIndex(ROLE_PHRASES.length, ROLE_PERIOD_MS, snapped.role === null);
    const idleLike = useCyclingIndex(LIKE_PHRASES.length, LIKE_PERIOD_MS, snapped.like === null, LIKE_OFFSET_MS);

    return (
        <p aria-live="off" className="text-2xl leading-snug text-muted sm:text-3xl dark:text-muted-dark">
            <span className="block text-inherit">
                &mdash;I&rsquo;m <RollingSlot phrases={ROLE_PHRASES} index={snapped.role ?? idleRole} snapped={snapped.role !== null} />
            </span>
            <span className="block text-inherit">
                who likes <RollingSlot phrases={LIKE_PHRASES} index={snapped.like ?? idleLike} snapped={snapped.like !== null} />
            </span>
        </p>
    );
}
