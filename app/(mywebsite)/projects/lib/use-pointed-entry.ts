"use client";

import { useMemo, useState } from "react";

export type PointerHandlers = {
    point: (id: string) => void;
    leave: () => void;
    focus: (id: string) => void;
    blur: () => void;
    hold: (id: string) => void;
    release: () => void;
};

/**
 * Which row the reader is pointing at with the mouse or with the keyboard, which one they pointed at
 * last, so the spotlight has something to keep showing once they move away, and which entry the panel
 * holds while the reader is inside it.
 */
export function usePointedEntry() {
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [focusId, setFocusId] = useState<string | null>(null);
    const [lastId, setLastId] = useState<string | null>(null);
    const [heldId, setHeldId] = useState<string | null>(null);

    const handlers = useMemo<PointerHandlers>(
        () => ({
            point: (id) => {
                setHoverId(id);
                setLastId(id);
            },
            leave: () => setHoverId(null),
            focus: (id) => {
                setFocusId(id);
                setLastId(id);
            },
            blur: () => setFocusId(null),
            hold: (id) => setHeldId(id),
            release: () => setHeldId(null),
        }),
        [],
    );

    return { hoverId, focusId, lastId, heldId, handlers };
}
