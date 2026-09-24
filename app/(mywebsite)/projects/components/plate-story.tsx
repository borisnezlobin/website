"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { actionClass } from "@/app/components/action";
import type { PlateContent } from "../content/types";
import { PlateHighlights } from "./plate-highlights";

const EASE = "ease-[cubic-bezier(0.2,0,0,1)]";
const PANEL_BASE = `grid transition-[grid-template-rows] duration-300 ${EASE} motion-reduce:transition-none`;
const PANEL_STATE = { open: "grid-rows-[1fr]", closed: "grid-rows-[0fr]" };
const TOGGLE = actionClass("subtle", `ms-1 align-baseline transition-colors duration-150 ${EASE}`);
const CARET = `transition-transform duration-300 ${EASE} motion-reduce:transition-none`;

type PlateStoryProps = Pick<PlateContent, "id" | "title" | "summary" | "highlights">;

export function PlateStory({ id, title, summary, highlights }: PlateStoryProps) {
    const [open, setOpen] = useState(false);
    const detailId = `${id}-detail`;
    const [lede, ...rest] = summary;
    const hasMore = rest.length > 0;

    return (
        <>
            <p className="mt-3 text-lg leading-relaxed">
                {lede}
                {hasMore && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={detailId}
                        onClick={() => setOpen((wasOpen) => !wasOpen)}
                        className={TOGGLE}
                    >
                        <span className="text-inherit">{open ? "Less" : "More"}</span>
                        <CaretDownIcon size={16} aria-hidden="true" className={`${CARET} ${open ? "rotate-180" : ""}`} />
                    </button>
                )}
            </p>
            <PlateHighlights highlights={highlights} label={`${title} highlights`} />
            <div id={detailId} inert={!open} className={`${PANEL_BASE} ${open ? PANEL_STATE.open : PANEL_STATE.closed}`}>
                <div className="overflow-hidden">
                    <p className="mt-4 text-lg leading-relaxed">{rest.join(" ")}</p>
                </div>
            </div>
        </>
    );
}
