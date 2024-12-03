"use client";

import { useEffect, useRef } from "react";

const DraftBadge = () => {
    const ref = useRef<HTMLDivElement>(null);
    const draftRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (ref.current && draftRef.current) {
            const width = ref.current.offsetWidth;
            const height = window.document.body.offsetHeight;

            const draftWidth = draftRef.current.offsetWidth;

            const repeatX = Math.ceil(width / (draftWidth + 196));

            for (let j = 0; j < repeatX + 1; j++) {
                const span = document.createElement("span");
                span.innerText = "DRAFT";
                ref.current.appendChild(span);
            }

            const sin = Math.sin(12 * Math.PI / 180);
            const repeatY = Math.ceil(height / (sin * width));

            for (let i = 0; i < repeatY - 1; i++) {
                const clone = ref.current.cloneNode(true) as HTMLDivElement;
                clone.style.top = `calc(${(i) * sin * width}px)`;
                ref.current.parentElement?.appendChild(clone);
            }
        }
    }, [ref, draftRef]);

    return (
        <>
            <div
                className="absolute top-0 md:top-[5rem] z-[5] left-0 w-screen text-2xl bg-transparent dark:bg-transparent pointer-events-none emph font-extrabold text-primary  flex flex-row justify-center dark:text-primary-dark"
            >
                <span>
                    DRAFT
                </span>
            </div>
            <div className="absolute print:hidden top-0 z-[5] left-0 w-full pointer-events-none emph bg-transparent dark:bg-transparent !font-extrabold text-primary/10 dark:text-primary-dark/10">
                <div
                    className="absolute flex flex-row w-full top-0 left-0 rotate-12 text-5xl bg-transparent dark:bg-transparent pointer-events-none emph font-extrabold text-primary/10 gap-[196px] dark:text-primary-dark/10"
                    ref={ref}
                    aria-hidden="true"
                >
                    <span ref={draftRef}>
                        DRAFT
                    </span>
                </div>
            </div>
        </>
    );
}

export { DraftBadge };