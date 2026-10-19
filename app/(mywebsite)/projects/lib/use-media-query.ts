"use client";

import { useCallback, useSyncExternalStore } from "react";

/** False on the server and during hydration, so the first paint matches the CSS-only layout. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query);
            list.addEventListener("change", onChange);
            return () => list.removeEventListener("change", onChange);
        },
        [query],
    );
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
