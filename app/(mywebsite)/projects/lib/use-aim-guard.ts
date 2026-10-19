"use client";

import { useCallback, useEffect, useMemo, useRef, type PointerEvent, type RefObject } from "react";
import { headingFor, type Point } from "./aim-geometry";

const SAMPLES = 3;
const SLACK_PX = 6;
/** A pointer that stops this long over a row it was only crossing has chosen that row after all. */
const SETTLE_MS = 300;

type Pending = { id: string; timer: number };

/**
 * Menu aim for the spotlight: while the pointer travels from the list toward the panel, the rows it
 * crosses don't take the panel over. A crossed row only wins if the pointer stops on it or turns away
 * from the panel while still over it. Pointing straight down the list switches rows at once.
 */
export function useAimGuard(targetRef: RefObject<HTMLElement | null>, commit: (id: string) => void, enabled: boolean) {
    const samples = useRef<Point[]>([]);
    const pending = useRef<Pending | null>(null);

    const cancel = useCallback(() => {
        if (pending.current) window.clearTimeout(pending.current.timer);
        pending.current = null;
    }, []);

    const flush = useCallback(() => {
        const chosen = pending.current?.id;
        cancel();
        if (chosen) commit(chosen);
    }, [cancel, commit]);

    const aiming = useCallback(() => {
        const target = targetRef.current;
        const trail = samples.current;
        if (!enabled || !target || trail.length < 2) return false;
        return headingFor(trail[0], trail[trail.length - 1], target.getBoundingClientRect(), SLACK_PX);
    }, [enabled, targetRef]);

    const defer = useCallback(
        (id: string) => {
            cancel();
            pending.current = { id, timer: window.setTimeout(flush, SETTLE_MS) };
        },
        [cancel, flush],
    );

    useEffect(() => cancel, [cancel]);

    return useMemo(
        () => ({
            track: (event: PointerEvent) => {
                samples.current = [...samples.current, { x: event.clientX, y: event.clientY }].slice(-SAMPLES);
                if (!pending.current) return;
                if (aiming()) defer(pending.current.id);
                else flush();
            },
            enterRow: (id: string) => (aiming() ? defer(id) : (cancel(), commit(id))),
            cancel,
        }),
        [aiming, cancel, commit, defer, flush],
    );
}
