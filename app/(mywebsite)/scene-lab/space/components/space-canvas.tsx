"use client";

import { useEffect, useRef } from "react";
import type { LookFactory } from "../lib/looks/look";

export type SpaceLookName = "ink-void" | "dark-neon" | "dither-render";

const LOOKS: Record<SpaceLookName, () => Promise<LookFactory>> = {
    "ink-void": () => import("../lib/looks/ink-void").then((module) => module.inkVoidLook),
    "dark-neon": () => import("../lib/looks/dark-neon").then((module) => module.darkNeonLook),
    "dither-render": () => import("../lib/looks/dither-render").then((module) => module.ditherRenderLook),
};

/** Thin React shell: three.js and the scene engine load only once this mounts. */
export function SpaceCanvas({ look }: { look: SpaceLookName }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let dispose: (() => void) | null = null;
        let cancelled = false;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        Promise.all([import("../lib/space-scene"), LOOKS[look]()])
            .then(([{ createSpaceScene }, lookFactory]) => {
                if (cancelled) return;
                dispose = createSpaceScene(canvas, { look: lookFactory, reducedMotion }).dispose;
            })
            .catch((error: unknown) => console.error("space scene failed to start", error));
        return () => {
            cancelled = true;
            dispose?.();
        };
    }, [look]);

    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full cursor-crosshair touch-pan-y" />;
}
