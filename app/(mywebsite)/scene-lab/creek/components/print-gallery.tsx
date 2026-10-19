"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { GalleryLightbox } from "@/app/(mywebsite)/projects/components/gallery-lightbox";
import type { ProjectMedia } from "@/app/(mywebsite)/projects/content/media";
import type { FloatingLayer } from "../lib/floating-layer";
import { createPrintStream, type PrintStream } from "../lib/gallery/print-stream";
import { prefersReducedMotion } from "../lib/stage";
import { FloatingPrint } from "./floating-print";

type PrintGalleryProps = {
    items: ProjectMedia[];
    label: string;
    /** The creek scene reads the floating layer from here and steps it with its water. */
    layerRef: MutableRefObject<FloatingLayer | null>;
};

type Slots = { roots: (HTMLButtonElement | null)[]; shadows: (HTMLDivElement | null)[] };

/** Focus can scroll the stage's overflow-hidden parent towards a print; the stage never scrolls. */
function pinScroll(element: HTMLElement | null) {
    if (!element) return () => { };
    const reset = () => { element.scrollTop = 0; element.scrollLeft = 0; };
    element.addEventListener("scroll", reset);
    return () => element.removeEventListener("scroll", reset);
}

function useReducedMotion() {
    const [still, setStill] = useState(false);
    useEffect(() => setStill(prefersReducedMotion()), []);
    return still;
}

/**
 * The photos and videos as paper prints floating on the creek, plus the lightbox they open.
 * Every print is a focusable button in the DOM, in the same order as `items`.
 */
export function PrintGallery({ items, label, layerRef }: PrintGalleryProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const slots = useRef<Slots>({ roots: [], shadows: [] });
    const streamRef = useRef<PrintStream | null>(null);
    const openerRef = useRef<HTMLButtonElement | null>(null);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const still = useReducedMotion();

    useEffect(() => {
        const stage = stageRef.current;
        const { roots, shadows } = slots.current;
        if (!stage) return;
        const prints = items.map((item, index) => ({
            elements: { root: roots[index]!, shadow: shadows[index]! },
            mediaWidth: item.width,
            mediaHeight: item.height,
        }));
        const stream = createPrintStream(stage, prints, { still: prefersReducedMotion() });
        streamRef.current = stream;
        layerRef.current = stream.layer;
        const unpin = pinScroll(stage.parentElement);
        return () => {
            unpin();
            stream.dispose();
            streamRef.current = null;
            layerRef.current = null;
        };
    }, [items, layerRef]);

    const open = (index: number) => {
        openerRef.current = slots.current.roots[index];
        setOpenIndex(index);
    };
    const close = () => {
        setOpenIndex(null);
        openerRef.current?.focus({ preventScroll: true });
    };
    const step = (direction: 1 | -1) => setOpenIndex((current) => current === null ? null : (current + direction + items.length) % items.length);

    return (
        <section aria-label={label} ref={stageRef} className="pointer-events-none absolute inset-0 z-10">
            {items.map((item, index) => (
                <FloatingPrint
                    key={item.src}
                    item={item}
                    still={still}
                    rootRef={(element) => { slots.current.roots[index] = element; }}
                    shadowRef={(element) => { slots.current.shadows[index] = element; }}
                    onHold={(held) => streamRef.current?.setHeld(index, held)}
                    onFocusIntent={() => streamRef.current?.bringIntoView(index)}
                    onOpen={() => open(index)}
                />
            ))}
            {openIndex !== null && (
                <GalleryLightbox items={items} index={openIndex} label={label} still={still} onStep={step} onClose={close} />
            )}
        </section>
    );
}
