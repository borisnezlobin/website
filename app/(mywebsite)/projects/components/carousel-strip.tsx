"use client";

import { PlayIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useRef, type FocusEvent, type MutableRefObject, type PointerEvent } from "react";
import { FOCUS_RING } from "@/app/components/action";
import type { ProjectMedia } from "../content/media";
import { THUMB_ATTR } from "../lib/carousel-focus";
import { MEDIA_EDGE } from "./media-styles";

const THUMB = `relative block size-14 shrink-0 spotlight:size-12 overflow-hidden rounded-md transition-opacity duration-150 ${FOCUS_RING}`;
const THUMB_STATE = {
    current: "ring-2 ring-light-foreground/80 dark:ring-dark-foreground/80",
    other: `opacity-60 hover:opacity-100 ${MEDIA_EDGE}`,
};
const VIDEO_BADGE = "pointer-events-none absolute left-1 top-1 grid size-5 place-items-center rounded-full bg-black/50 text-white";

/** The running item's clock: when the fill reaches the end, the carousel moves on. */
export type ThumbProgress = { cycleKey: string; holdMs: number; running: boolean; onDone: () => void };

function ProgressFill({ progress }: { progress: ThumbProgress }) {
    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 bottom-1 h-0.5 overflow-hidden rounded-full bg-black/40">
            <span
                key={progress.cycleKey}
                onAnimationEnd={progress.onDone}
                style={{ animationDuration: `${progress.holdMs}ms`, animationPlayState: progress.running ? "running" : "paused" }}
                className="absolute inset-0 origin-left animate-segment-fill bg-white"
            />
        </span>
    );
}

type CarouselStripProps = {
    items: ProjectMedia[];
    index: number;
    onSelect: (index: number) => void;
    onOpen: (index: number) => void;
    progress: ThumbProgress | null;
    /** In the desktop panel the thumbnails leave the natural tab order; the index routes Tab to them from the open row. */
    managedFocus: boolean;
    thumbRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
};

/**
 * One button per item, named by its alt text. Pointing at one or focusing it with the keyboard shows it;
 * clicking it or pressing Enter opens the lightbox there. A tap on a touch screen only shows it, and a
 * tap on the picture opens the lightbox.
 */
export function CarouselStrip({ items, index, onSelect, onOpen, progress, managedFocus, thumbRefs }: CarouselStripProps) {
    const tapped = useRef(false);
    const onPointerDown = (event: PointerEvent) => {
        tapped.current = event.pointerType === "touch";
    };
    const onPointerEnter = (event: PointerEvent, at: number) => {
        if (event.pointerType === "mouse") onSelect(at);
    };
    const onFocus = (event: FocusEvent<HTMLElement>, at: number) => {
        if (event.currentTarget.matches(":focus-visible")) onSelect(at);
    };
    const onClick = (at: number) => {
        if (tapped.current) onSelect(at);
        else onOpen(at);
        tapped.current = false;
    };

    return (
        <ul className="mt-3 flex list-none flex-wrap gap-2">
            {items.map((item, at) => (
                <li key={item.src}>
                    <button
                        ref={(element) => {
                            thumbRefs.current[at] = element;
                        }}
                        type="button"
                        {...{ [THUMB_ATTR]: "" }}
                        aria-label={item.alt}
                        aria-current={at === index ? "true" : undefined}
                        tabIndex={managedFocus ? -1 : 0}
                        onPointerDown={onPointerDown}
                        onPointerEnter={(event) => onPointerEnter(event, at)}
                        onFocus={(event) => onFocus(event, at)}
                        onClick={() => onClick(at)}
                        className={`${THUMB} ${at === index ? THUMB_STATE.current : THUMB_STATE.other}`}
                    >
                        <Image src={item.preview} alt="" width={item.width} height={item.height} sizes="56px" className="size-full object-cover" />
                        {item.kind === "video" && (
                            <span aria-hidden="true" className={VIDEO_BADGE}>
                                <PlayIcon size={10} weight="fill" />
                            </span>
                        )}
                        {at === index && progress && <ProgressFill progress={progress} />}
                    </button>
                </li>
            ))}
        </ul>
    );
}
