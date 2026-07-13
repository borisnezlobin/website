"use client";

import { useEffect, useState } from "react";
import BackToRouteLink from "@/app/components/back-to-route";
import { LinkButton } from "@/app/components/buttons";
import { WRITING_CATEGORY_KEY, paramToCategory, writingHref } from "../categories";

const readWritingHref = () => {
    try {
        return writingHref(paramToCategory(sessionStorage.getItem(WRITING_CATEGORY_KEY)));
    } catch { /* ignore */ }
    return "/writing";
};

export function WritingBackLink({
    variant,
    text,
    className,
}: {
    variant: "link" | "button";
    text: string;
    className?: string;
}) {
    const [href, setHref] = useState("/writing");
    useEffect(() => setHref(readWritingHref()), []);

    if (variant === "button") {
        return (
            <LinkButton direction="left" aria-label="Back to Writing" className={className} href={href}>
                {text}
            </LinkButton>
        );
    }
    return <BackToRouteLink href={href} className={className} text={text} />;
}
