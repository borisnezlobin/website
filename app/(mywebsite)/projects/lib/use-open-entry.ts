"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function entryInHash(ids: string[]) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    return ids.includes(id) ? id : null;
}

/**
 * One open row at a time. A link like /projects#enf opens that row and scrolls to it, and opening a
 * row puts its id in the address bar, so the link can be shared.
 */
export function useOpenEntry(ids: string[]) {
    const [openId, setOpenId] = useState<string | null>(null);
    const chosenHere = useRef(false);

    useEffect(() => {
        const openFromHash = () => {
            const id = entryInHash(ids);
            if (!id) return;
            setOpenId(id);
            requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
        };
        openFromHash();
        window.addEventListener("hashchange", openFromHash);
        return () => window.removeEventListener("hashchange", openFromHash);
    }, [ids]);

    useEffect(() => {
        if (!chosenHere.current) return;
        window.history.replaceState(null, "", openId ? `#${openId}` : window.location.pathname);
    }, [openId]);

    const toggle = useCallback((id: string) => {
        chosenHere.current = true;
        setOpenId((current) => (current === id ? null : id));
    }, []);

    return { openId, toggle };
}
