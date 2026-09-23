"use client";

import { useEffect, useState } from "react";

function differentIndex(current: number, length: number) {
    const step = 1 + Math.floor(Math.random() * (length - 1));
    return (current + step) % length;
}

export function useCyclingIndex(length: number, periodMs: number, running: boolean, startDelayMs = 0): number {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!running || length < 2) return;
        let interval = 0;
        const delay = window.setTimeout(() => {
            setIndex((current) => differentIndex(current, length));
            interval = window.setInterval(() => setIndex((current) => differentIndex(current, length)), periodMs);
        }, startDelayMs || periodMs);
        return () => {
            window.clearTimeout(delay);
            window.clearInterval(interval);
        };
    }, [length, periodMs, running, startDelayMs]);

    return index;
}
