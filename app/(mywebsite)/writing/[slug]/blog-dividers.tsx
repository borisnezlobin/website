"use client";

import { useEffect } from "react";
import { createSpinDrive, dividerMask } from "./spin-drive";

// component that replaces <hr> in blogs with a thin spin-drive texture band thingy
export function BlogDividers() {
    useEffect(() => {
        const root = document.querySelector(".blog-article");
        if (!root) return;

        root.querySelectorAll("hr").forEach((hr) => {
            const canvas = document.createElement("canvas");
            canvas.className = "blog-divider-canvas";
            canvas.style.display = "block";
            canvas.style.width = "100%";
            canvas.style.height = "30px";
            const wrap = document.createElement("div");
            wrap.setAttribute("aria-hidden", "true");
            wrap.style.margin = "2.4rem -3.5rem";
            wrap.style.width = "calc(100% + 7rem)";
            wrap.appendChild(canvas);
            hr.replaceWith(wrap);
        });

        const cleanups: Array<() => void> = [];
        root.querySelectorAll<HTMLCanvasElement>("canvas.blog-divider-canvas").forEach((canvas) => {
            cleanups.push(createSpinDrive(canvas, dividerMask, { cell: 13 }));
        });
        return () => cleanups.forEach((c) => c());
    }, []);

    return null;
}
