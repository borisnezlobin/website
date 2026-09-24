"use client";

import { useEffect, useRef, useState } from "react";
import { Chip } from "@/app/components/landing/chip";
import { highlightText } from "../content/highlights";
import type { PlateHighlight } from "../content/types";

const ROW_BASE =
    "mt-4 flex list-none flex-nowrap gap-2 overflow-x-auto rounded-sm outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-scrollbar]:hidden";
/** Fades the trailing edge so a row that runs past the column reads as scrollable. */
const TRAILING_FADE = "[mask-image:linear-gradient(to_right,black_calc(100%_-_3rem),transparent)]";

function useHorizontalOverflow<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        const row = ref.current;
        if (!row) return;
        const measure = () => setOverflowing(row.scrollWidth > row.clientWidth + 1);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(row);
        return () => observer.disconnect();
    }, []);

    return { ref, overflowing };
}

export function PlateHighlights({ highlights, label }: { highlights: PlateHighlight[]; label: string }) {
    const { ref, overflowing } = useHorizontalOverflow<HTMLUListElement>();
    if (highlights.length === 0) return null;
    return (
        <ul
            ref={ref}
            aria-label={label}
            tabIndex={overflowing ? 0 : undefined}
            className={`${ROW_BASE} ${overflowing ? TRAILING_FADE : ""}`}
        >
            {highlights.map((highlight) => (
                <li key={highlightText(highlight)} className="shrink-0">
                    <Chip>{highlightText(highlight)}</Chip>
                </li>
            ))}
        </ul>
    );
}
