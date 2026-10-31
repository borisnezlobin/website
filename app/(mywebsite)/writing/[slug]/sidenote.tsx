"use client";

import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { Footnote } from "./footnote-dom";

type SidenoteProps = {
    footnote: Footnote;
    inMargin: boolean;
    open: boolean;
    highlighted: boolean;
    onHover: (id: string | null) => void;
};

const NOTE_TYPE = "[font-family:var(--blog-serif)] text-sm leading-relaxed transition-colors duration-150";
const NOTE_BODY = "!text-inherit [&_*]:!text-inherit [&>p]:!m-0 [&>p+p]:!mt-2 [&>p:first-child]:!inline [&_a]:underline";

// Tailwind rewrites a `--name` arbitrary value into `var(--name)`, so the shared anchor name is set inline.
const MARGIN_ANCHOR_NAME = "--sidenote";

// Align the note's first baseline with the reference's baseline, unless the previous note still occupies that spot.
const MARGIN_PLACEMENT =
    "absolute left-full ml-8 w-60 [position-anchor:var(--sidenote-ref)] " +
    "[top:max(calc(anchor(bottom)_-_0.5lh_-_0.5cap),calc(anchor(--sidenote_bottom,0px)_+_1rem))]";

function textTone(highlighted: boolean) {
    return highlighted ? "!text-light-foreground dark:!text-dark-foreground" : "!text-muted dark:!text-muted-dark";
}

function NoteContent({ footnote, highlighted }: Pick<SidenoteProps, "footnote" | "highlighted">) {
    return (
        <>
            <span className={`mr-2 font-semibold tabular-nums transition-colors duration-150 ${highlighted ? "text-primary" : "text-light-foreground dark:text-dark-foreground"}`}>
                {footnote.label}
            </span>
            <div className={`inline ${NOTE_BODY}`} dangerouslySetInnerHTML={{ __html: footnote.html }} />
        </>
    );
}

function MarginNote({ footnote, highlighted, onHover }: Omit<SidenoteProps, "inMargin" | "open">) {
    return (
        <aside
            id={footnote.id}
            role="note"
            className={`${MARGIN_PLACEMENT} ${NOTE_TYPE} ${textTone(highlighted)} animate-fade-in print:hidden`}
            style={{ "--sidenote-ref": footnote.anchorName, anchorName: MARGIN_ANCHOR_NAME } as CSSProperties}
            onPointerEnter={(event) => event.pointerType === "mouse" && onHover(footnote.id)}
            onPointerLeave={() => onHover(null)}
        >
            <NoteContent footnote={footnote} highlighted={highlighted} />
        </aside>
    );
}

function InlineNote({ footnote, open, highlighted }: Omit<SidenoteProps, "inMargin" | "onHover">) {
    return (
        <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none print:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            inert={!open}
        >
            <aside id={footnote.id} role="note" className="min-h-0 overflow-hidden">
                <div className={`mt-3 mb-5 border-l-2 border-muted/40 pl-4 dark:border-muted-dark/40 ${NOTE_TYPE} ${textTone(highlighted)}`}>
                    <NoteContent footnote={footnote} highlighted={highlighted} />
                </div>
            </aside>
        </div>
    );
}

export function Sidenote({ inMargin, ...props }: SidenoteProps) {
    const note = inMargin ? <MarginNote {...props} /> : <InlineNote {...props} />;
    return createPortal(note, props.footnote.slot);
}
