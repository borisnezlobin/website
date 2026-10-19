"use client";

import { PauseIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectMedia } from "../content/media";
import { prefersReducedMotion } from "../lib/use-reduced-motion";
import { ON_MEDIA_CONTROL } from "./media-styles";

type LoopingVideoProps = {
    item: ProjectMedia;
    /** Reduced motion: the video starts paused on its poster. */
    still: boolean;
    /** Plays only while true, on top of the viewer's own pause. */
    active?: boolean;
    /** The play and pause disc in the corner. A video that only plays while pointed at can go without it. */
    showControl?: boolean;
    className: string;
    style?: CSSProperties;
};

/** A muted, looping clip that never starts itself under reduced motion. */
export function LoopingVideo({ item, still, active = true, showControl = true, className, style }: LoopingVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(() => still || prefersReducedMotion());
    const playing = active && !paused;
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (playing) video.play().catch(() => setPaused(true));
        else video.pause();
    }, [playing]);
    return (
        <>
            <video
                ref={videoRef}
                src={item.src}
                poster={item.preview}
                aria-label={item.alt}
                muted
                loop
                playsInline
                preload="metadata"
                width={item.width}
                height={item.height}
                className={className}
                style={style}
            />
            {showControl && (
                <button type="button" aria-label={paused ? "Play video" : "Pause video"} className={`absolute bottom-4 left-4 ${ON_MEDIA_CONTROL}`} onClick={() => setPaused(!paused)}>
                    {paused ? <PlayIcon size={20} weight="fill" /> : <PauseIcon size={20} weight="fill" />}
                </button>
            )}
        </>
    );
}
