"use client";

import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { ProjectMedia } from "../content/media";
import { LoopingVideo } from "./looping-video";
import { PRINT_PAPER, ROUND_CONTROL } from "./media-styles";

type GalleryLightboxProps = {
    items: ProjectMedia[];
    index: number;
    label: string;
    still: boolean;
    onStep: (direction: 1 | -1) => void;
    onClose: () => void;
};

const MEDIA_FIT = "block h-auto object-contain";

/** Every print as large as the screen allows: photos and clips of the same shape come out the same size. */
function printSize(item: ProjectMedia): CSSProperties {
    const ratio = item.width / item.height;
    return { width: `min(88vw, 72rem, calc(72svh * ${ratio}))`, aspectRatio: `${ratio}` };
}

const STEP_KEYS: Record<string, 1 | -1> = { ArrowRight: 1, ArrowLeft: -1 };

function preloadNeighbours(items: ProjectMedia[], index: number) {
    for (const offset of [1, -1]) {
        const item = items[(index + offset + items.length) % items.length];
        const image = new window.Image();
        image.src = item.kind === "image" ? item.src : item.preview;
    }
}

type StepperProps = { index: number; count: number; onStep: (direction: 1 | -1) => void };

function Stepper({ index, count, onStep }: StepperProps) {
    return (
        <div className="flex items-center gap-4">
            <button type="button" aria-label="Previous" className={ROUND_CONTROL} onClick={() => onStep(-1)}>
                <CaretLeftIcon size={20} />
            </button>
            <p className="min-w-16 text-center text-sm tabular-nums text-muted dark:text-muted-dark" aria-live="polite">
                {index + 1} of {count}
            </p>
            <button type="button" aria-label="Next" className={ROUND_CONTROL} onClick={() => onStep(1)}>
                <CaretRightIcon size={20} />
            </button>
        </div>
    );
}

/**
 * The gallery opened up: a native modal dialog, so the page behind it is inert and Escape closes
 * it. The print is laid on paper at full size, with previous and next on either side of a counter.
 */
export function GalleryLightbox({ items, index, label, still, onStep, onClose }: GalleryLightboxProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const item = items[index];

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        closeRef.current?.focus();
    }, []);
    useEffect(() => preloadNeighbours(items, index), [items, index]);

    const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
        const direction = STEP_KEYS[event.key];
        if (!direction) return;
        event.preventDefault();
        onStep(direction);
    };
    const closeOnScrim = (event: MouseEvent<HTMLElement>) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
    };

    return (
        <dialog
            ref={dialogRef}
            aria-label={label}
            onClose={onClose}
            onKeyDown={onKeyDown}
            className="pointer-events-auto fixed inset-0 m-0 h-full max-h-none w-full max-w-none overscroll-contain bg-light-background/95 p-0 text-light-foreground backdrop:bg-transparent dark:bg-dark-background/95 dark:text-dark-foreground"
        >
            <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-4 py-6" onClick={closeOnScrim}>
                <figure key={index} className={`relative p-2 shadow-2xl sm:p-3 motion-safe:animate-fade-in ${PRINT_PAPER}`}>
                    {item.kind === "video"
                        ? <LoopingVideo item={item} still={still} className={MEDIA_FIT} style={printSize(item)} />
                        : <Image src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="88vw" priority className={MEDIA_FIT} style={printSize(item)} />}
                </figure>
                {items.length > 1 && <Stepper index={index} count={items.length} onStep={onStep} />}
            </div>
            <button ref={closeRef} type="button" aria-label="Close" className={`absolute right-4 top-4 ${ROUND_CONTROL}`} onClick={() => dialogRef.current?.close()}>
                <XIcon size={20} />
            </button>
        </dialog>
    );
}
