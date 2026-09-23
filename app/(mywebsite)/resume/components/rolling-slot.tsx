"use client";

import { useLayoutEffect, useRef, useState } from "react";

const ENTER_MS = 520;
const ENTER_DELAY_MS = 150;
const LEAVE_MS = 300;
const ROLL_DISTANCE = "0.7em";
const SETTLE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

type Layers = { current: number; leaving: number | null; turn: number };

type RollingSlotProps = {
    phrases: readonly string[];
    index: number;
    snapped: boolean;
};

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function rollIn(element: HTMLElement) {
    element.animate(
        [
            { transform: `translateY(${ROLL_DISTANCE})`, opacity: 0, filter: "blur(4px)" },
            { transform: "translateY(0)", opacity: 1, filter: "blur(0)" },
        ],
        { duration: ENTER_MS, delay: ENTER_DELAY_MS, easing: SETTLE, fill: "backwards" },
    );
}

function rollOut(element: HTMLElement) {
    return element.animate(
        [
            { transform: "translateY(0)", opacity: 1, filter: "blur(0)" },
            { transform: `translateY(-${ROLL_DISTANCE})`, opacity: 0, filter: "blur(4px)" },
        ],
        { duration: LEAVE_MS, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    );
}

const CELL = "col-start-1 row-start-1 [text-wrap:pretty]";
const SNAP_MARK = "underline decoration-primary decoration-2 underline-offset-4";
const IDLE_MARK = "underline decoration-transparent decoration-2 underline-offset-4";

export function RollingSlot({ phrases, index, snapped }: RollingSlotProps) {
    const [layers, setLayers] = useState<Layers>({ current: index, leaving: null, turn: 0 });
    const entering = useRef<HTMLSpanElement>(null);
    const leaving = useRef<HTMLSpanElement>(null);

    if (index !== layers.current) {
        setLayers({ current: index, leaving: layers.current, turn: layers.turn + 1 });
    }

    useLayoutEffect(() => {
        if (layers.turn === 0) return;
        if (prefersReducedMotion() || !entering.current || !leaving.current) {
            setLayers((now) => ({ ...now, leaving: null }));
            return;
        }
        rollIn(entering.current);
        const exit = rollOut(leaving.current);
        exit.onfinish = () => setLayers((now) => (now.turn === layers.turn ? { ...now, leaving: null } : now));
    }, [layers.turn]);

    return (
        <span className="inline-grid max-w-full align-top [clip-path:inset(0_-1em)]">
            {phrases.map((phrase) => (
                <span key={phrase} aria-hidden="true" className={`${CELL} invisible`}>{phrase}</span>
            ))}
            {layers.leaving !== null && (
                <span ref={leaving} aria-hidden="true" className={`${CELL} text-light-foreground dark:text-dark-foreground`}>
                    {phrases[layers.leaving]}
                </span>
            )}
            <span
                key={layers.turn}
                ref={entering}
                className={`${CELL} text-light-foreground transition-[text-decoration-color] duration-500 dark:text-dark-foreground ${snapped ? SNAP_MARK : IDLE_MARK}`}
            >
                {phrases[layers.current]}
            </span>
        </span>
    );
}
