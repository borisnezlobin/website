"use client";

import { useEffect, useState } from "react";

export const REQUEST_EXAMPLES = [
    "I’m recruiting a robotics intern at Andera",
    "I need someone who does computer vision",
    "https://jobs.lever.co/acme/robotics-software-engineer",
    "I’m hiring for a full-stack role at a startup",
    "I need someone who writes embedded firmware",
];

const TYPE_MS = 45;
const ERASE_MS = 18;
const HOLD_MS = 2200;

type Typing = { example: number; length: number; erasing: boolean };

function nextTyping({ example, length, erasing }: Typing): { next: Typing; delay: number } {
    const full = REQUEST_EXAMPLES[example].length;
    if (!erasing && length < full) return { next: { example, length: length + 1, erasing }, delay: TYPE_MS };
    if (!erasing) return { next: { example, length, erasing: true }, delay: HOLD_MS };
    if (length > 0) return { next: { example, length: length - 1, erasing }, delay: ERASE_MS };
    return { next: { example: (example + 1) % REQUEST_EXAMPLES.length, length: 0, erasing: false }, delay: TYPE_MS * 6 };
}

export function useTypedPlaceholder(paused: boolean): string {
    const [typing, setTyping] = useState<Typing>({ example: 0, length: REQUEST_EXAMPLES[0].length, erasing: false });
    const [still, setStill] = useState(true);

    useEffect(() => {
        setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }, []);

    useEffect(() => {
        if (still || paused) return;
        const { next, delay } = nextTyping(typing);
        const timer = window.setTimeout(() => setTyping(next), delay);
        return () => window.clearTimeout(timer);
    }, [typing, still, paused]);

    return REQUEST_EXAMPLES[typing.example].slice(0, typing.length);
}
