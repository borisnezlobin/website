"use client";

import { useEffect, useRef } from "react";
import { createCanopy, type CanopyLook } from "@/app/(mywebsite)/projects/canopy/canopy-engine";
import { WEEPING_CHERRY } from "@/app/(mywebsite)/projects/canopy/cherry/look";
import { INK_WILLOW } from "../lib/willow/look";

const LOOKS = {
    "ink-willow": INK_WILLOW,
    "weeping-cherry": WEEPING_CHERRY,
} satisfies Record<string, CanopyLook>;

export type CanopyDirection = keyof typeof LOOKS;

/** Thin React host: the engine owns the canvas from mount to unmount. */
export function CanopyScene({ direction }: { direction: CanopyDirection }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const scene = createCanopy(canvas, LOOKS[direction]);
        return scene?.dispose;
    }, [direction]);

    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full touch-pan-y [image-rendering:pixelated]" />;
}
