"use client";

import { useEffect, useRef } from "react";
import { loadCanvasFont } from "./creek-fonts";

export type CreekEngine = { dispose: () => void };

type CreekCanvasProps = {
    fontFamily: string;
    fontWeights: number[];
    create: (canvas: HTMLCanvasElement, fontFamily: string) => CreekEngine;
};

/** A full-stage decorative canvas that starts its engine once the font it draws with has loaded. */
export function CreekCanvas({ fontFamily, fontWeights, create }: CreekCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let engine: CreekEngine | null = null;
        let cancelled = false;
        loadCanvasFont(fontFamily, fontWeights)
            .catch(() => undefined)
            .then(() => { if (!cancelled) engine = create(canvas, fontFamily); });
        return () => { cancelled = true; engine?.dispose(); };
    }, [fontFamily, fontWeights, create]);
    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full bg-light-background dark:bg-dark-background" />;
}
