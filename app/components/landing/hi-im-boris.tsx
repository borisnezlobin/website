"use client";

import { useEffect, useState, useRef } from "react";

const badgeQuotes = [
    "I code.",
    "I love programming.",
    "I build cool things.",
    "I solve problems.",
    "I learn new things.",
    "I write stuff.",
    "Drop the “The.”",
    "Chief Executive Officer",
    "@b_nezlobin on Twitter.",
    "1% better every day.",
    "Staying hydrated, ish.",
    "Are you gonna finish that?",
    "Outlier?",
]

const FADE_DURATION = 400; // ms

const HiImBoris = () => {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
    const quoteRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setFadeState('out');
            setTimeout(() => {
                setQuoteIndex((prev) => Math.floor(Math.random() * badgeQuotes.length));
                setFadeState('in');
            }, FADE_DURATION);
        }, 4 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[100svh] relative top-[-6rem] items-center w-full flex flex-col justify-center p-4 print:h-auto print:relative print:top-0 print:p-0 print:mb-2">
            <p className="md:hidden text-base md:text-2xl relative left-4 emph z-10 bg-light-background dark:bg-dark-background rounded-t-lg px-4 py-1">Hi, I&apos;m</p>
            <h1 className="md:hidden text-8xl relative right-4 bottom-4 font-bold edo z-10 text-center md:text-7xl bg-transparent dark:bg-transparent rounded-lg px-4 pb-3 py-1 vectra">
                Boris.
            </h1>
            <h1 className="hidden md:block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold edo z-10 text-center print:text-5xl print:mt-0 print:mb-1">
                <span className="text-muted dark:text-muted dark font-normal text-4xl">I&apos;m</span>
                <span className="vectra">
                    Boris.
                </span>
            </h1>
            <div
                className={`hidden relative w-96 md:block print:hidden z-10 shadow-lg bg-light-background dark:bg-dark-background border border-muted dark:border-muted-dark rounded-lg px-4 py-1 print:text-xl print:mt-0 print:mb-2`}
            >
                <p
                    ref={quoteRef}
                    className="w-full text-xl text-center print:text-xl emph"
                    style={{
                        opacity: fadeState === 'in' ? 1 : 0,
                        transition: `opacity ${FADE_DURATION}ms cubic-bezier(.4,0,.2,1)`,
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        // fontFamily: "vectra",
                    }}
                >
                    {badgeQuotes[quoteIndex]}
                </p>
            </div>
        </div>
    );
}

export { HiImBoris };