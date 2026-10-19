import { MedalIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * The page's one accent mark, for a project that won something. It hangs in the row's indent, centred on
 * the tagline's first line, so every tagline keeps the same left edge and the mark never wraps onto a line
 * of its own. Its parent must be positioned. Screen readers hear "(award winner)" after the tagline.
 */
export function AwardMark() {
    return (
        <span className="absolute end-full top-[0.5lh] me-1 flex -translate-y-1/2 text-primary md:me-2">
            <MedalIcon aria-hidden="true" weight="fill" className="size-3.5 md:size-4" />
            <span className="sr-only">(award winner)</span>
        </span>
    );
}
