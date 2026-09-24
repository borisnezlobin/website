import { MedalIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * The page's one accent mark: it sits beside the name of a project that won
 * something, so the awards are findable while scrolling without every fact
 * turning into a badge.
 */
export function AwardMark({ size }: { size: number }) {
    return (
        <span className="ms-[0.35em] inline-flex translate-y-[0.1em] align-baseline text-primary">
            <MedalIcon size={size} weight="fill" aria-hidden="true" />
            <span className="sr-only">(award winner)</span>
        </span>
    );
}
