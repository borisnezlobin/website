"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { actionClass } from "@/app/components/action";
import type { PlateContent } from "../content/types";
import { PlateHighlights } from "./plate-highlights";

const EASE = "ease-[cubic-bezier(0.2,0,0,1)]";
const TOGGLE = actionClass("subtle", `ms-1 align-baseline transition-colors duration-150 ${EASE}`);
const REST = "animate-fade-in motion-reduce:animate-none";

type PlateStoryProps = Pick<PlateContent, "id" | "title" | "summary" | "highlights">;

/**
 * The continuation joins the lede inside one paragraph, so an opened plate reads as prose rather
 * than a caption above a second block. That rules out animating height, which needs a block wrapper.
 */
export function PlateStory({ id, title, summary, highlights }: PlateStoryProps) {
    const [open, setOpen] = useState(false);
    const detailId = `${id}-detail`;
    const [lede, ...rest] = summary;
    const hasMore = rest.length > 0;

    return (
        <>
            <p className="mt-3 text-lg leading-relaxed">
                {lede}
                {open && (
                    <span id={detailId} className={REST}>
                        {` ${rest.join(" ")}`}
                    </span>
                )}
                {hasMore && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={open ? detailId : undefined}
                        onClick={() => setOpen((wasOpen) => !wasOpen)}
                        className={TOGGLE}
                    >
                        <span className="text-inherit">{open ? "Less" : "More"}</span>
                        <CaretDownIcon
                            size={16}
                            aria-hidden="true"
                            className={`transition-transform duration-300 ${EASE} motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                        />
                    </button>
                )}
            </p>
            <PlateHighlights highlights={highlights} label={`${title} highlights`} />
        </>
    );
}
