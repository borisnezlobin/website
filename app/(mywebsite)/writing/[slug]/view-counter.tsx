"use client";

import { useEffect } from "react";
import { viewArticle } from "./view-article";

export function ViewCounter({ slug }: { slug: string; }) {
    useEffect(() => {
        const storageKey = `viewed:${slug}`;
        if (sessionStorage.getItem(storageKey)) return;

        sessionStorage.setItem(storageKey, "1");
        viewArticle(slug);
    }, [slug]);

    return (<></>);
}
