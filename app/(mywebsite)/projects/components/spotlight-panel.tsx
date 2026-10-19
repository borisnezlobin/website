"use client";

import { useRef, type FocusEvent, type RefObject } from "react";
import { PROJECT_MEDIA } from "../content/media";
import type { ProjectEntry } from "../content/types";
import { useMediaCycle } from "../lib/use-media-cycle";
import { MediaCarousel } from "./media-carousel";

/** The panel sticks 6rem down; the rest of the cut leaves room for two rows of thumbnails and some air. */
const PANEL_MAX_HEIGHT = "calc(100svh - 19rem)";
const PANEL_SIZES = "(min-width: 1280px) 34rem, 40vw";

export type PanelHold = { hold: () => void; release: () => void };

type SpotlightPanelProps = {
    panelRef: RefObject<HTMLElement | null>;
    entry: ProjectEntry;
    openId: string | null;
    /** The reader is pointing at a row: the carousel runs through the items on its own. */
    rowPointed: boolean;
    /** The reader is inside the panel: the carousel stops moving on and follows the thumbnails. */
    held: boolean;
    still: boolean;
    onHold: PanelHold;
};

/** Focus moved to an element outside the panel. A blur with nowhere to go, like the lightbox closing, doesn't count. */
const leftPanel = (event: FocusEvent<HTMLElement>) => event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget);

/**
 * The panel holds its entry while the pointer is over it or keyboard focus is in it, and lets go only
 * when both have gone. The lightbox is a child of the panel, so closing it can look like the pointer
 * leaving; the thumbnail it hands focus back to keeps the hold.
 */
function usePanelHold({ hold, release }: PanelHold) {
    const inside = useRef({ pointer: false, keyboard: false });
    const update = (part: "pointer" | "keyboard", value: boolean) => {
        inside.current[part] = value;
        if (inside.current.pointer || inside.current.keyboard) hold();
        else release();
    };
    return {
        onPointerEnter: () => update("pointer", true),
        onPointerLeave: () => update("pointer", false),
        onFocus: (event: FocusEvent<HTMLElement>) => {
            if (event.target.matches(":focus-visible")) update("keyboard", true);
        },
        onBlur: (event: FocusEvent<HTMLElement>) => {
            if (leftPanel(event)) update("keyboard", false);
        },
    };
}

/**
 * Beside the list, the carousel of the row being pointed at, or that row's paragraph when it has no media.
 * An open row already shows its paragraph, so when it has nothing else the panel stays empty.
 */
export function SpotlightPanel({ panelRef, entry, openId, rowPointed, held, still, onHold }: SpotlightPanelProps) {
    const items = PROJECT_MEDIA[entry.id] ?? [];
    const cycle = useMediaCycle(entry.id, items);
    const cycles = items.length > 1 && !still;
    const body = items.length === 0 && openId !== entry.id ? { key: `body:${entry.id}`, text: entry.body } : null;
    const holdEvents = usePanelHold(onHold);
    const progress = cycles ? { cycleKey: `${entry.id}:${cycle.index}`, holdMs: cycle.holdMs, running: rowPointed && !held, onDone: cycle.advance } : null;

    return (
        <aside
            ref={panelRef}
            aria-label={entry.name}
            {...holdEvents}
        >
            <div className="sticky top-24">
                <MediaCarousel
                    label={entry.name}
                    items={items}
                    selection={cycle}
                    body={body}
                    maxHeight={PANEL_MAX_HEIGHT}
                    sizes={PANEL_SIZES}
                    playing={(rowPointed || held) && !still}
                    still={still}
                    progress={progress}
                    managedFocus
                    pausable={false}
                    onClipLength={cycle.noteClipLength}
                />
            </div>
        </aside>
    );
}
