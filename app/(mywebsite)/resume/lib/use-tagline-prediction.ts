"use client";

import { useEffect, useState } from "react";
import type { SlotPrediction, TaglinePrediction } from "@/app/lib/resume/tagline/types";
import { MAX_TAGLINE_INPUT } from "@/app/lib/resume/tagline/types";

const TAGLINE_ENDPOINT = "/api/resume/tagline";
const DEBOUNCE_MS = 250;
const MIN_PREDICTABLE_LENGTH = 3;
const CONFIDENT_ENOUGH = 0.4;

export type SnappedSlots = { role: number | null; like: number | null };

const NOTHING_SNAPPED: SnappedSlots = { role: null, like: null };

function confidentIndex(slot: SlotPrediction | null): number | null {
    return slot && slot.confidence >= CONFIDENT_ENOUGH ? slot.index : null;
}

function snappedFrom(prediction: TaglinePrediction): SnappedSlots {
    if (!prediction.predicted) return NOTHING_SNAPPED;
    return { role: confidentIndex(prediction.role), like: confidentIndex(prediction.like) };
}

async function fetchPrediction(text: string, signal: AbortSignal): Promise<SnappedSlots> {
    const response = await fetch(TAGLINE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, MAX_TAGLINE_INPUT) }),
        signal,
    });
    if (!response.ok) return NOTHING_SNAPPED;
    return snappedFrom((await response.json()) as TaglinePrediction);
}

export function useTaglinePrediction(draft: string): SnappedSlots {
    const [snapped, setSnapped] = useState<SnappedSlots>(NOTHING_SNAPPED);
    const text = draft.trim();
    const predictable = text.length >= MIN_PREDICTABLE_LENGTH;

    useEffect(() => {
        if (!predictable) {
            setSnapped(NOTHING_SNAPPED);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            fetchPrediction(text, controller.signal)
                .then((next) => { if (!controller.signal.aborted) setSnapped(next); })
                .catch(() => {});
        }, DEBOUNCE_MS);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [text, predictable]);

    return snapped;
}
