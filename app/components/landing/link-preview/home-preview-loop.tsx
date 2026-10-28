"use client";

import { useEffect, useRef } from "react";
import { castHomeFilm, createHomePainter } from "./home-film";
import { FRAME, LOOP_SECONDS } from "./timeline";

declare global {
    interface Window {
        renderHomePreviewFrame?: (seconds: number) => string;
    }
}

/**
 * The home page's link-preview loop: the red flock signs "Boris.", the humpback climbs through
 * it, and the flock lifts the ink back off to sign again. With `capture` it holds still and a
 * renderer asks for each frame.
 */
export function HomePreviewLoop({ capture }: { capture: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        let frame = 0;
        let disposed = false;
        canvas.width = FRAME.width;
        canvas.height = FRAME.height;
        void Promise.all([document.fonts.load("bold 100px vectra"), document.fonts.load("44px charter")]).then(castHomeFilm).then((cast) => {
            if (disposed) return;
            const paint = createHomePainter(cast);
            const draw = (seconds: number) => paint(ctx, ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS);
            window.renderHomePreviewFrame = (seconds) => {
                draw(seconds);
                return canvas.toDataURL("image/png");
            };
            if (capture) return;
            const tick = (now: number) => {
                draw(now / 1000);
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        });
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            delete window.renderHomePreviewFrame;
        };
    }, [capture]);

    return <canvas ref={canvasRef} aria-hidden="true" className="block" style={{ width: FRAME.width, height: FRAME.height }} />;
}
