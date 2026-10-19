"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createTextSlicer, type TextSlicer } from "@/app/lib/sliced-shader/text-slicer";

type SlicedTextProps = { torn: boolean; children: ReactNode } & HTMLAttributes<HTMLSpanElement>;

/** Inline text that tears like the Writing page's Personal quote while `torn` is set, and heals after. */
export function SlicedText({ torn, children, className = "", ...rest }: SlicedTextProps) {
    const textRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const slicer = useRef<TextSlicer | null>(null);

    useEffect(() => () => slicer.current?.dispose(), []);

    useEffect(() => {
        if (!slicer.current && torn && textRef.current && canvasRef.current) {
            slicer.current = createTextSlicer(textRef.current, canvasRef.current);
        }
        return slicer.current?.animateTo(torn ? 1 : 0);
    }, [torn]);

    return (
        <span className={`relative ${className}`} {...rest}>
            <span ref={textRef}>{children}</span>
            <canvas ref={canvasRef} aria-hidden className="pointer-events-none invisible absolute" />
        </span>
    );
}
