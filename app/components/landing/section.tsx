"use client";

import { useIsVisible } from "@/app/utils/use-is-visible";
import { useRef } from "react";

const Section = ({
    title, description, children
}: { title: string, description: string, children: any }) => {
    const ref = useRef(null);
    const isVisible = useIsVisible(ref);

    return (
        <div ref={ref} className={`w-full flex flex-col justify-center items-left mt-4 [transition:all_300ms,opacity_2s,transform_2s] ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-105"}`}>
            <h2 className="text-xl sm:text-4xl mt-12 font-bold text-left dark:text-dark">
                {title}
            </h2>
            <p className="mt-4">
                {description}
            </p>
            {children}
        </div>
    )
}

export { Section };