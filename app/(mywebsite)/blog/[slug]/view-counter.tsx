"use client";

import { useEffect } from "react";
import { EyeIcon } from "@phosphor-icons/react";
import { viewArticle } from "./view-article";

export function ViewCounter({ slug }: { slug: string; }) {
    useEffect(() => {
        viewArticle(slug);
    }, [slug]);

    return (<></>);
}
