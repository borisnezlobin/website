"use client";

import { useEffect, useState, type FocusEvent, type PointerEvent, type RefObject } from "react";

const isMouse = (event: { pointerType: string }) => event.pointerType === "mouse";

/**
 * When the fan is out. A mouse opens it by hovering the anchor and closes it by leaving the fan;
 * a keyboard opens it by tabbing onto any claim; a finger taps the anchor to open or fold it, and
 * a tap anywhere else folds it.
 */
export function useFanTriggers(boxRef: RefObject<HTMLElement | null>) {
    const [fanned, setFanned] = useState(false);

    useEffect(() => {
        if (!fanned) return;
        const foldOnTapOutside = (event: globalThis.PointerEvent) => {
            if (!isMouse(event) && !boxRef.current?.contains(event.target as Node)) setFanned(false);
        };
        document.addEventListener("pointerdown", foldOnTapOutside);
        return () => document.removeEventListener("pointerdown", foldOnTapOutside);
    }, [fanned, boxRef]);

    const box = {
        onPointerLeave: (event: PointerEvent) => {
            if (isMouse(event)) setFanned(false);
        },
        onFocus: () => setFanned(true),
        onBlur: (event: FocusEvent) => {
            if (!boxRef.current?.contains(event.relatedTarget as Node | null)) setFanned(false);
        },
    };

    const anchor = {
        onPointerOver: (event: PointerEvent) => {
            if (isMouse(event)) setFanned(true);
        },
        onPointerDown: (event: PointerEvent) => {
            if (!isMouse(event)) setFanned((open) => !open);
        },
    };

    return { fanned, box, anchor };
}
