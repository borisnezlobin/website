"use client";

import { useCallback, useState } from "react";
import type { ProjectMedia } from "../content/media";

const IMAGE_HOLD_MS = 2500;
/** A clip plays through once, but a long one is cut off here so the cycle keeps moving. */
const VIDEO_CAP_MS = 8000;

/**
 * Which of an entry's photos and clips the spotlight is on. Pointing at a different entry starts
 * again from its lead. A picked thumbnail jumps straight to its item. The caller decides when `advance`
 * runs; nothing here moves on its own.
 */
export function useMediaCycle(entryId: string, items: ProjectMedia[]) {
    const [cycle, setCycle] = useState({ entryId, index: 0 });
    const [clipMs, setClipMs] = useState<Record<string, number>>({});
    if (cycle.entryId !== entryId) setCycle({ entryId, index: 0 });

    const index = cycle.entryId === entryId && items.length > 0 ? cycle.index % items.length : 0;
    const current = items[index] ?? null;
    const holdMs = current?.kind === "video" ? (clipMs[current.src] ?? VIDEO_CAP_MS) : IMAGE_HOLD_MS;

    const advance = useCallback(() => setCycle((now) => ({ ...now, index: now.index + 1 })), []);
    const select = useCallback((picked: number) => setCycle({ entryId, index: picked }), [entryId]);
    const noteClipLength = useCallback((src: string, seconds: number) => {
        if (!Number.isFinite(seconds)) return;
        setClipMs((known) => (known[src] ? known : { ...known, [src]: Math.min(seconds * 1000, VIDEO_CAP_MS) }));
    }, []);

    return { index, current, next: items.length > 1 ? items[(index + 1) % items.length] : null, holdMs, advance, select, noteClipLength };
}
