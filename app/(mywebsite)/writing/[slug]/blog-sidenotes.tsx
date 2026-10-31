"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mountFootnotes, type Footnote } from "./footnote-dom";
import { Sidenote } from "./sidenote";

// Column (38.5rem) plus a 2rem gap, a 15rem note and a gutter on each side.
const MARGIN_MEDIA = "(min-width: 76rem)";
const FLASH_MS = 1600;
const REF_BASE_CLASSES = ["transition-colors", "duration-150", "relative", "after:absolute", "after:-inset-2.5"];
const REF_HIGHLIGHT_CLASS = "!text-primary";

function supportsAnchoredNotes() {
    return ["anchor-name: --a", "top: anchor(bottom)", "top: 1lh", "top: 1cap"].every((rule) => CSS.supports(rule));
}

function subscribeToMargin(onChange: () => void) {
    const query = window.matchMedia(MARGIN_MEDIA);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function useNotesFitInMargin() {
    return useSyncExternalStore(
        subscribeToMargin,
        () => window.matchMedia(MARGIN_MEDIA).matches && supportsAnchoredNotes(),
        () => false,
    );
}

function scrollBehavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function useFlash() {
    const [flashedId, setFlashedId] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const flash = useCallback((id: string) => {
        clearTimeout(timer.current);
        setFlashedId(id);
        document.getElementById(id)?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
        timer.current = setTimeout(() => setFlashedId(null), FLASH_MS);
    }, []);
    useEffect(() => () => clearTimeout(timer.current), []);
    return { flashedId, flash };
}

function useRefListeners(footnotes: Footnote[], onActivate: (id: string) => void, onHover: (id: string | null) => void) {
    useEffect(() => {
        const detach = footnotes.flatMap(({ id, refs }) => refs.map((ref) => {
            const click = (event: MouseEvent) => { event.preventDefault(); onActivate(id); };
            const enter = (event: PointerEvent) => event.pointerType === "mouse" && onHover(id);
            const focus = () => onHover(id);
            const leave = () => onHover(null);
            ref.classList.add(...REF_BASE_CLASSES);
            ref.addEventListener("click", click);
            ref.addEventListener("pointerenter", enter);
            ref.addEventListener("pointerleave", leave);
            ref.addEventListener("focus", focus);
            ref.addEventListener("blur", leave);
            return () => {
                ref.classList.remove(...REF_BASE_CLASSES, REF_HIGHLIGHT_CLASS);
                ref.removeEventListener("click", click);
                ref.removeEventListener("pointerenter", enter);
                ref.removeEventListener("pointerleave", leave);
                ref.removeEventListener("focus", focus);
                ref.removeEventListener("blur", leave);
            };
        }));
        return () => detach.forEach((off) => off());
    }, [footnotes, onActivate, onHover]);
}

/** Moves an article's footnotes beside their references: into the margin on wide screens, tap-to-open on narrow ones. */
export function BlogSidenotes() {
    const [footnotes, setFootnotes] = useState<Footnote[]>([]);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
    const inMargin = useNotesFitInMargin();
    const { flashedId, flash } = useFlash();

    useEffect(() => {
        const root = document.querySelector(".blog-article");
        if (!root) return;
        const { footnotes, restore } = mountFootnotes(root);
        setFootnotes(footnotes);
        return () => { restore(); setFootnotes([]); };
    }, []);

    const toggleOpen = useCallback((id: string) => setOpenIds((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
    }), []);

    const activate = useCallback((id: string) => (inMargin ? flash(id) : toggleOpen(id)), [inMargin, flash, toggleOpen]);
    useRefListeners(footnotes, activate, setHoveredId);

    const isHighlighted = useCallback(
        (id: string) => id === hoveredId || id === flashedId || (!inMargin && openIds.has(id)),
        [hoveredId, flashedId, inMargin, openIds],
    );

    useEffect(() => {
        footnotes.forEach(({ id, refs }) => refs.forEach((ref) => {
            ref.classList.toggle(REF_HIGHLIGHT_CLASS, isHighlighted(id));
            if (inMargin) ref.removeAttribute("aria-expanded");
            else ref.setAttribute("aria-expanded", String(openIds.has(id)));
        }));
    }, [footnotes, isHighlighted, inMargin, openIds]);

    return footnotes.map((footnote) => (
        <Sidenote
            key={footnote.id}
            footnote={footnote}
            inMargin={inMargin}
            open={openIds.has(footnote.id)}
            highlighted={isHighlighted(footnote.id)}
            onHover={setHoveredId}
        />
    ));
}
