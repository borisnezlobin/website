"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, type FocusEvent, type PointerEvent } from "react";
import { FOCUS_RING } from "@/app/components/action";
import type { ProjectEntry } from "../content/types";
import type { PointerHandlers } from "../lib/use-pointed-entry";
import { AwardMark } from "./award-mark";
import { EntryDetail } from "./entry-detail";
import { Reveal } from "./reveal";

const ROW_BUTTON = `group -mx-1.5 flex w-[calc(100%+0.75rem)] cursor-pointer items-start gap-4 rounded-md px-1.5 py-3 text-left ${FOCUS_RING}`;
/** Sits on the tagline's first line: one line box tall, the caret centred in it. */
const CARET = "flex h-[1lh] shrink-0 items-center text-lg text-muted transition-colors duration-150 group-hover:text-light-foreground group-data-[marked=true]:text-light-foreground dark:text-muted-dark dark:group-hover:text-dark-foreground dark:group-data-[marked=true]:text-dark-foreground";
/** The row the spotlight is on reads a step darker; the caret's turn, not the colour, says whether it is open. */
const TAGLINE = "relative block text-pretty text-lg font-bold transition-colors duration-150 group-hover:text-black group-data-[marked=true]:text-black dark:group-hover:text-white dark:group-data-[marked=true]:text-white";
const CARET_TURN = "transition-transform duration-150 ease-out group-aria-expanded:rotate-180 motion-reduce:transition-none";

export type RowHandlers = PointerHandlers & { toggle: (id: string) => void };

type IndexRowProps = {
    entry: ProjectEntry;
    open: boolean;
    marked: boolean;
    /** The spotlight panel is beside the list, so the row leaves its photos to it. */
    spotlight: boolean;
    still: boolean;
    handlers: RowHandlers;
};

/** Mouse clicks focus the button too; only keyboard focus should move the spotlight. */
const isKeyboardFocus = (event: FocusEvent<HTMLElement>) => event.currentTarget.matches(":focus-visible");

/** One project: its tagline, its name under it, and the paragraph, links and media it opens to. */
export function IndexRow({ entry, open, marked, spotlight, still, handlers }: IndexRowProps) {
    const detailId = `${entry.id}-detail`;
    const [opened, setOpened] = useState(open);
    if (open && !opened) setOpened(true);

    const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") handlers.point(entry.id);
    };
    const onFocus = (event: FocusEvent<HTMLElement>) => {
        if (isKeyboardFocus(event)) handlers.focus(entry.id);
    };

    return (
        <li id={entry.id} className="scroll-mt-20" onPointerEnter={onPointerEnter}>
            <h3>
                <button type="button" data-marked={marked} aria-expanded={open} aria-controls={detailId} onClick={() => handlers.toggle(entry.id)} onFocus={onFocus} onBlur={handlers.blur} className={ROW_BUTTON}>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={TAGLINE}>
                            {entry.tagline}
                            {entry.won && <AwardMark />}
                        </span>
                        <span className="block text-base text-muted dark:text-muted-dark">{entry.name}</span>
                    </span>
                    <span aria-hidden="true" className={CARET}>
                        <CaretDownIcon size={18} className={CARET_TURN} />
                    </span>
                </button>
            </h3>
            <Reveal id={detailId} open={open}>
                {opened && <EntryDetail entry={entry} open={open} withCarousel={!spotlight} still={still} />}
            </Reveal>
        </li>
    );
}
