"use client";

import { useEffect, useRef } from "react";
import { createSpinDrive, watchSpinColors } from "@/app/lib/spin-drive";
import { FIGURES, type FigureId } from "../figures/registry";

type FigureCanvasProps = {
    figure: FigureId;
    className?: string;
};

export function FigureCanvas({ figure, className = "" }: FigureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const spec = FIGURES[figure];
        const instance = spec.createInstance();
        const { colors, stop: stopColors } = watchSpinColors();
        const stopDrive = createSpinDrive(canvas, instance.mask, {
            cell: spec.cell,
            brightness: instance.brightness,
            beforeFrame: instance.beforeFrame,
            onFrame: (ctx, w, h, t) => instance.overlay?.(ctx, w, h, t, colors),
        });
        return () => {
            stopDrive();
            stopColors();
        };
    }, [figure]);

    return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
