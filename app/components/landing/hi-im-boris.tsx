"use client";

import { useEffect, useState, useRef } from "react";

const badgeQuotes = [
    "I build cool things.",
    "I solve problems.",
    "Writing cool stuff!",
    "Working on secret tech @ UC Berkeley!",
    "Tokenmaxxer? I barely know her.",
    "Drop the “The.”",
    "IEOR & Applied Mathematics, 2029",
    "Boris had a farm, studying I-E-O-R.",
    "@b_nezlobin on Twitter.",
    "1% better every day.",
    "Staying hydrated, ish.",
    "Are you gonna finish that?",
    "/photography!",
]

const FADE_DURATION = 400; // ms

const HiImBoris = () => {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const quoteRef = useRef<HTMLParagraphElement>(null);

    const currentQuote = badgeQuotes[quoteIndex];

    // for typing
    useEffect(() => {
        if (fadeState === 'in') {
            setIsTyping(true);
            setDisplayedText("");
            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < currentQuote.length) {
                    setDisplayedText(currentQuote.slice(0, i + 1));
                    i++;
                } else {
                    setIsTyping(false);
                    clearInterval(typingInterval);
                }
            }, 75);

            return () => clearInterval(typingInterval);
        }
    }, [currentQuote, fadeState]);

    useEffect(() => {
        const interval = setInterval(() => {
            setFadeState('out');
            setTimeout(() => {
                setQuoteIndex((prev) => {
                    let newIndex = Math.floor(Math.random() * badgeQuotes.length)
                    while (newIndex === prev) {
                        newIndex = Math.floor(Math.random() * badgeQuotes.length)
                    }
                    return newIndex;
                });
                setFadeState('in');
            }, FADE_DURATION);
        }, 4 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[100svh] relative top-[2rem] items-center w-full flex flex-col justify-center p-4 print:h-auto print:relative print:top-0 print:p-0 print:mb-2">
            <div className="relative flex flex-col items-center">
                <img
                    src="/whale-assets/uptotheright.webp"
                    alt=""
                    aria-hidden
                    width={1048}
                    height={547}
                    fetchPriority="high"
                    decoding="async"
                    data-whale-hero
                    className="whale-negative pointer-events-none select-none absolute z-0 max-w-none w-[132%] md:w-[min(680px,90vw)] lg:w-[780px] left-1/4 -translate-x-1/2 md:-translate-x-[50%] bottom-[50%] md:bottom-[8%] print:hidden"
                />
                <p className="md:hidden text-base relative left-[87px] bottom-[64px] emph z-10 rounded-t-lg px-4 py-1 print:z-20 print:!bg-transparent">
                    Hi, I&rsquo;m
                </p>
                <h1 className="md:hidden text-8xl relative left-[min(1rem,(100vw_-_100%)/2)] bottom-9 font-bold edo z-10 text-center rounded-lg px-4 pb-3 py-1 vectra">
                    Boris.
                </h1>
                <h1 className="hidden md:block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold edo z-10 text-center print:text-5xl print:mt-0 print:mb-1">
                    <span className="text-muted dark:text-muted dark font-normal text-4xl relative left-10">
                        I&rsquo;m
                    </span>
                    <span className="vectra">
                        Boris.
                    </span>
                </h1>
            </div>
            <div
                className={`hidden relative w-96 md:block print:hidden z-10 px-4 py-1 print:text-xl print:mt-0 print:mb-2`}
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
                    {displayedText}
                    <span 
                        className={`inline-block w-0.5 h-5 bg-current ml-1 ${isTyping || fadeState === 'in' ? 'animate-pulse' : 'animate-ping'}`}
                        style={{ animation: isTyping ? 'none' : 'blink 1s infinite' }}
                    />
                </p>
                <style jsx>{`
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }
                `}</style>
            </div>
        </div>
    );
}

export { HiImBoris };