"use client";

import { useEffect, useId, useRef, useState } from "react";

interface AbbreviationProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

export const Abbreviation = ({ label, children, className }: AbbreviationProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);
    const tooltipId = useId();

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsideInteraction = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutsideInteraction);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideInteraction);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    return (
        <span ref={containerRef} className="relative inline align-baseline">
            <button
                type="button"
                aria-describedby={isOpen ? tooltipId : undefined}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setIsOpen(true);
                }}
                onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") setIsOpen(false);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                className={`inline align-baseline cursor-help underline decoration-dotted decoration-current underline-offset-4 ${className ?? ""}`}
            >
                {children}
            </button>
            <span
                id={tooltipId}
                role="tooltip"
                className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(18rem,70vw)] -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-1.5 text-center text-xs font-normal leading-snug text-white shadow-lg transition-all duration-150 dark:bg-white dark:text-neutral-900 ${
                    isOpen ? "opacity-100 translate-y-0" : "translate-y-1 opacity-0"
                }`}
                aria-hidden={!isOpen}
            >
                {label}
            </span>
        </span>
    );
};
