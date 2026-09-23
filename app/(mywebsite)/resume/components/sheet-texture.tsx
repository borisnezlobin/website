"use client";

import { useEffect, useRef } from "react";
import { createSpinDrive } from "@/app/lib/spin-drive";
import { sheetMask, type SheetFill } from "../lib/sheet-mask";

const SHEET_CELL = 8;
const CREEP_SECONDS = 5;
const EASING = 0.08;

type SheetTextureProps = {
    progress: number;
    nextProgress: number;
};

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function creepingTarget(from: number, to: number, secondsInStage: number) {
    return from + (to - from) * 0.85 * (1 - Math.exp(-secondsInStage / CREEP_SECONDS));
}

export function SheetTexture({ progress, nextProgress }: SheetTextureProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fill = useRef<SheetFill>({ shown: 0, pulse: 0 });
    const target = useRef({ from: progress, to: nextProgress, since: -1 });
    const reducedMotion = useRef(false);

    useEffect(() => {
        target.current = { from: progress, to: nextProgress, since: -1 };
        if (reducedMotion.current) fill.current.shown = progress;
    }, [progress, nextProgress]);

    const stillProgress = useStillProgressKey(progress);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        reducedMotion.current = prefersReducedMotion();
        if (reducedMotion.current) fill.current.shown = target.current.from;
        return createSpinDrive(canvas, sheetMask(fill.current), {
            cell: SHEET_CELL,
            onFrame: (_ctx, _w, _h, t) => {
                const goal = target.current;
                if (goal.since < 0) goal.since = t;
                const aim = creepingTarget(goal.from, goal.to, t - goal.since);
                fill.current.shown += (aim - fill.current.shown) * EASING;
                fill.current.pulse = 0.5 + 0.5 * Math.sin(t * 3);
            },
        });
    }, [stillProgress]);

    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

// Under reduced motion the drive paints a single frame, so it has to be rebuilt to show a new stage.
function useStillProgressKey(progress: number) {
    const reduced = typeof window !== "undefined" && prefersReducedMotion();
    return reduced ? progress : 0;
}
