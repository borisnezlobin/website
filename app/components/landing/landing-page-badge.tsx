"use client";

import { useIsVisible } from "@/app/utils/use-is-visible";
import { Separator } from "@/components/separator";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef } from "react";

const LandingPageBadge = ({
    title, description, url, className, titleClassName = "", index = undefined
}: { title: string, description: string, url?: string, className?: string, titleClassName?: string, index?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    const component = (
        <div ref={ref} className={`
            p-4 flex flex-col md:flex-row items-start md:items-center justify-start gap-2 rounded-lg border dark:border-neutral-800
            ${url ? "cursor-pointer hover:scale-105" : ""}
            ${index === undefined ? (isVisible ? "translate-y-0" : "translate-y-10") : ""}
            ${className ? className : ""}
        `}>
            <b className={`text-xl ${titleClassName}`}>
                {title}
            </b>
            {description && <Separator size="medium" className="hidden md:block transition-colors duration-300" />}
            <p className="transition-colors duration-300">
                {description}
            </p>
            {url && <ArrowSquareOut />}
        </div>
    );

    if(url){
        return (
            <Link href={url} rel="noopener noreferrer" target="_blank">
                {component}
            </Link>
        )
    }

    return component;
}

export { LandingPageBadge };