"use client";

import { PauseIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { useRef, useState, type MutableRefObject } from "react";
import type { ProjectMedia } from "../content/media";
import { useLayers } from "../lib/use-layers";
import { CarouselStrip, type ThumbProgress } from "./carousel-strip";
import { CarouselViewer, type ViewerLayer } from "./carousel-viewer";
import { GalleryLightbox } from "./gallery-lightbox";
import { stageRatioFor } from "./media-frame";
import { ON_MEDIA_CONTROL } from "./media-styles";

/** A paragraph standing in for missing media gets a 4:3 card. */
const BODY_RATIO = 4 / 3;

const layerFor = (item: ProjectMedia): ViewerLayer => ({ key: item.src, item });

type Body = { key: string; text: string } | null;

/** The shown item and the one after it, or the stand-in paragraph when there is no media. */
function wantedLayers(current: ProjectMedia | null, next: ProjectMedia | null, body: Body): ViewerLayer[] {
    if (!current) return body ? [{ key: body.key, body: body.text }] : [];
    return next ? [layerFor(current), layerFor(next)] : [layerFor(current)];
}

const shownKeyFor = (current: ProjectMedia | null, body: Body) => (current ? current.src : (body?.key ?? null));

/** The lightbox, and the thumbnail that gets focus back when it closes. */
function useLightbox(count: number, thumbRefs: MutableRefObject<(HTMLButtonElement | null)[]>) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const opener = useRef<number | null>(null);
    const open = (at: number) => {
        opener.current = at;
        setOpenIndex(at);
    };
    const close = () => {
        setOpenIndex(null);
        if (opener.current !== null) thumbRefs.current[opener.current]?.focus({ preventScroll: true });
    };
    const step = (direction: 1 | -1) => setOpenIndex((at) => (at === null ? null : (at + direction + count) % count));
    return { openIndex, open, close, step };
}

function PauseControl({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
    return (
        <button type="button" aria-label={paused ? "Play video" : "Pause video"} onClick={onToggle} className={`pointer-events-auto absolute bottom-3 left-3 ${ON_MEDIA_CONTROL}`}>
            {paused ? <PlayIcon size={20} weight="fill" /> : <PauseIcon size={20} weight="fill" />}
        </button>
    );
}

type Selection = { index: number; current: ProjectMedia | null; next: ProjectMedia | null; select: (index: number) => void };

type MediaCarouselProps = {
    label: string;
    items: ProjectMedia[];
    selection: Selection;
    /** The stand-in when there is no media; null leaves the stage empty. */
    body: Body;
    maxHeight: string;
    sizes: string;
    playing: boolean;
    still: boolean;
    progress: ThumbProgress | null;
    managedFocus: boolean;
    /** Phones get a pause button on the clip, because nothing stops it but the reader. */
    pausable: boolean;
    onClipLength: (src: string, seconds: number) => void;
};

/** A project's photos and clips: the picture on top with the thumbnails right under it, and the lightbox they open. */
export function MediaCarousel({ label, items, selection, body, maxHeight, sizes, playing, still, progress, managedFocus, pausable, onClipLength }: MediaCarouselProps) {
    const { index, current, next, select } = selection;
    const [paused, setPaused] = useState(still);
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const lightbox = useLightbox(items.length, thumbRefs);
    const layers = useLayers(wantedLayers(current, next, body));
    const showsClip = pausable && current?.kind === "video";

    return (
        <div>
            <CarouselViewer
                layers={layers}
                shownKey={shownKeyFor(current, body)}
                current={current}
                stageRatio={items.length > 0 ? stageRatioFor(items) : BODY_RATIO}
                maxHeight={maxHeight}
                sizes={sizes}
                playing={playing && !(pausable && paused)}
                onOpen={() => lightbox.open(index)}
                onClipLength={onClipLength}
                overlay={showsClip ? <PauseControl paused={paused} onToggle={() => setPaused(!paused)} /> : undefined}
            />
            {items.length > 0 && (
                <CarouselStrip items={items} index={index} onSelect={select} onOpen={lightbox.open} progress={progress} managedFocus={managedFocus} thumbRefs={thumbRefs} />
            )}
            {lightbox.openIndex !== null && <GalleryLightbox items={items} index={lightbox.openIndex} label={label} still={still} onStep={lightbox.step} onClose={lightbox.close} />}
        </div>
    );
}
