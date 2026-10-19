"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { ProjectMedia } from "../content/media";
import { fitInStage, MediaFrame, STAGE_PLACE } from "./media-frame";

export type ViewerLayer = { key: string; item: ProjectMedia } | { key: string; body: string };

/** Layers only change opacity, so items of any shape crossfade without anything around them moving. */
const LAYER = "opacity-0 transition-opacity duration-200 ease-out data-[shown=true]:opacity-100";

type ClipProps = { item: ProjectMedia; shown: boolean; playing: boolean; onLength: (src: string, seconds: number) => void };

/** Starts over each time it comes back into view, and holds still whenever the reader looks away. */
function ViewerClip({ item, shown, playing, onLength }: ClipProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (shown && videoRef.current) videoRef.current.currentTime = 0;
    }, [shown]);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (playing) video.play().catch(() => undefined);
        else video.pause();
    }, [playing]);
    return (
        <video
            ref={videoRef}
            src={item.src}
            poster={item.preview}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedMetadata={(event) => onLength(item.src, event.currentTarget.duration)}
            className="absolute inset-0 size-full object-cover"
        />
    );
}

type LayerViewProps = { layer: ViewerLayer; stageRatio: number; shown: boolean; playing: boolean; sizes: string; onLength: ClipProps["onLength"] };

function LayerView({ layer, stageRatio, shown, playing, sizes, onLength }: LayerViewProps) {
    if ("body" in layer) {
        return (
            <figure data-shown={shown} className={`${LAYER} absolute inset-0 rounded-lg bg-light-foreground/5 p-8 lg:p-10 dark:bg-dark-foreground/10`}>
                <p className="h-full overflow-hidden text-pretty text-base leading-relaxed [mask-image:linear-gradient(to_bottom,black_85%,transparent)] lg:text-lg lg:leading-relaxed">{layer.body}</p>
            </figure>
        );
    }
    const { item } = layer;
    return (
        <MediaFrame data-shown={shown} style={fitInStage(item, stageRatio)} className={`${LAYER} ${STAGE_PLACE}`}>
            {item.kind === "video" ? (
                <ViewerClip item={item} shown={shown} playing={playing && shown} onLength={onLength} />
            ) : (
                <Image src={item.src} alt="" fill sizes={sizes} loading="eager" className="object-cover" />
            )}
        </MediaFrame>
    );
}

type CarouselViewerProps = {
    layers: ViewerLayer[];
    shownKey: string | null;
    current: ProjectMedia | null;
    /** Width over height of the stage, fixed per entry, so nothing moves while its items change. */
    stageRatio: number;
    maxHeight: string;
    sizes: string;
    playing: boolean;
    onOpen: () => void;
    onClipLength: ClipProps["onLength"];
    /** A control over the shown clip, such as the phone's pause button. */
    overlay?: ReactNode;
};

/**
 * The big picture of the carousel. The stage keeps one size per entry; the space an item doesn't fill
 * stays page background. Clicking the picture opens the lightbox; keyboard and screen reader users get
 * the same from the thumbnails, so the picture itself is not a tab stop.
 */
export function CarouselViewer({ layers, shownKey, current, stageRatio, maxHeight, sizes, playing, onOpen, onClipLength, overlay }: CarouselViewerProps) {
    return (
        <div className="relative w-full [container-type:size]" style={{ aspectRatio: `${stageRatio}`, maxHeight }}>
            {layers.map((layer) => (
                <LayerView key={layer.key} layer={layer} stageRatio={stageRatio} shown={layer.key === shownKey} playing={playing} sizes={sizes} onLength={onClipLength} />
            ))}
            {current && shownKey && (
                <button type="button" tabIndex={-1} aria-hidden="true" onClick={onOpen} style={fitInStage(current, stageRatio)} className={`${STAGE_PLACE} cursor-zoom-in rounded-lg`} />
            )}
            {current && shownKey && overlay && (
                <div style={fitInStage(current, stageRatio)} className={`${STAGE_PLACE} pointer-events-none`}>
                    {overlay}
                </div>
            )}
        </div>
    );
}
