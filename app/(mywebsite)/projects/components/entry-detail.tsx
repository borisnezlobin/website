"use client";

import type { ProjectEntry } from "../content/types";
import { entryLinks } from "../content/links";
import { PROJECT_MEDIA } from "../content/media";
import { useMediaCycle } from "../lib/use-media-cycle";
import { MediaCarousel } from "./media-carousel";
import { ProjectLink } from "./project-link";

/** Tall enough to see, short enough that a portrait phone clip never fills the whole screen. */
const PHONE_MAX_HEIGHT = "min(60svh, 28rem)";

function EntryLinks({ entry }: { entry: ProjectEntry }) {
    const links = entryLinks(entry);
    if (links.length === 0) return null;
    return (
        <ul className="-my-2 flex list-none flex-wrap gap-x-6">
            {links.map((link) => (
                <li key={link.href}>
                    <ProjectLink href={link.href}>
                        {link.label}
                    </ProjectLink>
                </li>
            ))}
        </ul>
    );
}

type RowCarouselProps = { entry: ProjectEntry; open: boolean; still: boolean };

/** Without the spotlight panel, the open row carries its own carousel. Nothing moves on its own here; the reader taps through. */
function RowCarousel({ entry, open, still }: RowCarouselProps) {
    const items = PROJECT_MEDIA[entry.id] ?? [];
    const selection = useMediaCycle(entry.id, items);
    if (items.length === 0) return null;
    return (
        <MediaCarousel
            label={entry.name}
            items={items}
            selection={selection}
            body={null}
            maxHeight={PHONE_MAX_HEIGHT}
            sizes="100vw"
            playing={open && !still}
            still={still}
            progress={null}
            managedFocus={false}
            pausable
            onClipLength={selection.noteClipLength}
        />
    );
}

type EntryDetailProps = {
    entry: ProjectEntry;
    open: boolean;
    /** Without the spotlight beside the list, the row shows its photos itself, above the paragraph. */
    withCarousel: boolean;
    still: boolean;
};

export function EntryDetail({ entry, open, withCarousel, still }: EntryDetailProps) {
    return (
        <div className="flex flex-col gap-4 pb-10 pt-2">
            {withCarousel && <RowCarousel entry={entry} open={open} still={still} />}
            <p className="max-w-prose text-pretty text-lg leading-relaxed">{entry.body}</p>
            <EntryLinks entry={entry} />
        </div>
    );
}
