"use client";

import React, { useEffect, useRef, useState } from "react";

const CrossOut = ({ originalText, replaceText }: { originalText: React.ReactNode; replaceText: React.ReactNode }) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const [isCrossed, setIsCrossed] = useState(false);
    const [showReplace, setShowReplace] = useState(false);

    useEffect(() => {
        let frameId: number | null = null;

        const updateState = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const triggerFromBottom = window.innerHeight * 0.3;
            const distanceFromBottom = window.innerHeight - rect.top;

            setIsCrossed(distanceFromBottom >= triggerFromBottom);
        };

        const onScrollOrResize = () => {
            if (frameId !== null) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateState);
        };

        updateState();
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);

        return () => {
            if (frameId !== null) cancelAnimationFrame(frameId);
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, []);

    useEffect(() => {
        if (!isCrossed) {
            setShowReplace(false);
            return;
        }
        // wait for crossout line + originalText fade (~700ms), then swap
        const timer = setTimeout(() => setShowReplace(true), 700);
        return () => clearTimeout(timer);
    }, [isCrossed]);

    return (
        <span ref={containerRef} className="relative inline-grid align-baseline [grid-template-areas:'stack']">
            <span
                aria-hidden="true"
                data-nosnippet
                className={`[grid-area:stack] relative text-center transition-opacity duration-500 ease-out ${isCrossed ? "opacity-0" : "opacity-100"}`}
            >
                {originalText}
                <span
                    className={`pointer-events-none absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-current origin-left transition-transform duration-700 ease-out ${
                        isCrossed ? "scale-x-100" : "scale-x-0"
                    }`}
                />
            </span>

            <span className={`[grid-area:stack] transition-opacity duration-500 ease-out ${showReplace ? "opacity-100" : "opacity-0"}`}>
                {replaceText}
            </span>
        </span>
    );
};

export default CrossOut;