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
                flex md:flex-row items-start md:items-center justify-center gap-2 rounded-lg border dark:border-neutral-800
                ${url ? "cursor-pointer hover:scale-105 print:flex-col" : "print:flex-row print:items-center"}
                ${description ? "p-4" : "px-4 py-2 items-center h-12"}
                ${index === undefined ? (isVisible ? "translate-y-0" : "translate-y-10") : ""}
                ${className ? className : "flex-col"}
                print:gap-2 print:p-2 print:rounded-none print:border-none print:translate-y-0
            `}
            style={{
                animationDuration: `${index !== undefined ? "1s" : 0}`,
            }}
        >
            <b className={`text-lg print:flex print:text-lg print:gap-2 print:items-center ${titleClassName} flex items-center justify-center gap-2`}>
                {title}
                {url && <ArrowSquareOut className="print:hidden md:hidden" />}
            </b>
            {description && <Separator size="medium" className="hidden md:block transition-colors duration-300 print:hidden" />}
            {description && <p className="transition-colors duration-300">
                {description}
            </p>}
            {url && <ArrowSquareOut className="print:hidden hidden md:block" />}
            {url && <span aria-hidden="true" className="hidden print:block text-muted">{url}</span>}
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