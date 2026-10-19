"use client";

import { PlayIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FOCUS_RING } from "@/app/components/action";
import type { ProjectMedia } from "@/app/(mywebsite)/projects/content/media";
import { PRINT_PAPER } from "@/app/(mywebsite)/projects/components/media-styles";
import { PRINT_SHADOW } from "./print-styles";

/**
 * A held print lifts and keeps drifting slowly, so its edge can slide out from under a resting
 * pointer; letting go only after a short grace stops it flickering between held and free.
 */
const RELEASE_GRACE_MS = 350;

type FloatingPrintProps = {
    item: ProjectMedia;
    still: boolean;
    rootRef: (element: HTMLButtonElement | null) => void;
    shadowRef: (element: HTMLDivElement | null) => void;
    onHold: (held: boolean) => void;
    onFocusIntent: () => void;
    onOpen: () => void;
};

/**
 * One print on the water: a real button over the canvas, named by the photo's alt text. The
 * print stream moves it every frame through transforms; this component only handles input and,
 * for a video, plays the loop while the print is held.
 */
export function FloatingPrint({ item, still, rootRef, shadowRef, onHold, onFocusIntent, onOpen }: FloatingPrintProps) {
    const [held, setHeld] = useState(false);
    const release = useRef<number | undefined>(undefined);
    const hold = (next: boolean) => {
        window.clearTimeout(release.current);
        setHeld(next);
        onHold(next);
    };
    const letGo = () => {
        window.clearTimeout(release.current);
        release.current = window.setTimeout(() => hold(false), RELEASE_GRACE_MS);
    };
    useEffect(() => () => window.clearTimeout(release.current), []);
    const playing = held && item.kind === "video" && !still;
    return (
        <>
            <div ref={shadowRef} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 origin-center will-change-transform ${PRINT_SHADOW}`} />
            <button
                ref={rootRef}
                type="button"
                aria-label={item.kind === "video" ? `${item.alt} (video)` : item.alt}
                className={`pointer-events-auto absolute left-0 top-0 block origin-center cursor-pointer will-change-transform ${PRINT_PAPER} ${FOCUS_RING}`}
                onPointerEnter={() => hold(true)}
                onPointerLeave={letGo}
                onFocus={() => { onFocusIntent(); hold(true); }}
                onBlur={() => hold(false)}
                onClick={onOpen}
            >
                <span className="relative block h-full w-full overflow-hidden bg-light-foreground/10">
                    <Image src={item.preview} alt="" fill sizes="(max-width: 640px) 30vw, 170px" draggable={false} className="object-cover" />
                    {playing && <video src={item.src} poster={item.preview} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
                    {item.kind === "video" && !playing && (
                        <span aria-hidden="true" className="absolute bottom-1 left-1 flex size-5 items-center justify-center rounded-full bg-black/45 text-white">
                            <PlayIcon size={10} weight="fill" />
                        </span>
                    )}
                </span>
            </button>
        </>
    );
}
