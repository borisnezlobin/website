"use client";

import { useEffect, useRef } from "react";
import { canopyMask, createSpinDrive } from "@/app/lib/spin-drive";

// spin drive vrooom
export function BlogHeroTexture() {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        return createSpinDrive(ref.current, canopyMask);
    }, []);
    return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
