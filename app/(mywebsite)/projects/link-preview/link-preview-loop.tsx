"use client";

import { useEffect, useRef } from "react";
import { createPreviewPainter } from "./preview-paint";
import { createPreviewStage, SCENE } from "./preview-stage";
import { LOOP_SECONDS } from "./timeline";

/** Set like the projects page's "I do stuff." on a narrow screen. */
const HEADLINE_SETTING = { left: 34, baseline: 272, fontSize: 38 };
const FONT_FAMILY = "charter";

declare global {
    interface Window {
        renderLinkPreviewFrame?: (seconds: number) => string;
    }
}

/**
 * The projects page's link-preview loop. Plays in real time, or with `capture` holds still and
 * lets a renderer ask for each frame as a PNG data URL.
 */
export function LinkPreviewLoop({ capture }: { capture: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let frame = 0;
        let disposed = false;
        canvas.width = SCENE.width * SCENE.dpr;
        canvas.height = SCENE.height * SCENE.dpr;
        void document.fonts.load(`${HEADLINE_SETTING.fontSize}px ${FONT_FAMILY}`).then(() => {
            if (disposed) return;
            const draw = createPreviewPainter(createPreviewStage(HEADLINE_SETTING, FONT_FAMILY), canvas);
            window.renderLinkPreviewFrame = (seconds) => {
                draw(seconds % LOOP_SECONDS);
                return canvas.toDataURL("image/png");
            };
            if (capture) return;
            const tick = (now: number) => {
                draw((now / 1000) % LOOP_SECONDS);
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        });
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            delete window.renderLinkPreviewFrame;
        };
    }, [capture]);

    return <canvas ref={canvasRef} data-link-preview aria-hidden="true" className="block [image-rendering:pixelated]" style={{ width: SCENE.width * SCENE.dpr, height: SCENE.height * SCENE.dpr }} />;
}
