"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FEEDBACK_MS = 1600;

export function useCopyFeedback() {
    const [copied, setCopied] = useState<string | null>(null);
    const timer = useRef<number>(undefined);

    const copy = useCallback(async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            return;
        }
        setCopied(value);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(null), FEEDBACK_MS);
    }, []);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    return { copied, copy };
}
