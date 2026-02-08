"use client";

import { useIsVisible } from "@/app/utils/use-is-visible";
import { Separator } from "@/app/components/separator";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef } from "react";

const LandingPageBadge = ({
    title, description, url, className, titleClassName = "", index = undefined, icon
}: { title: string, description: string, url?: string, className?: string, titleClassName?: string, index?: number, icon?: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    const component = (
        <div ref={ref} className={`
                flex md:flex-row items-start md:items-center justify-center !transition-transform duration-300 gap-2 rounded-lg border dark:border-neutral-800
                ${url ? "cursor-pointer hover:scale-105 print:flex-col" : "print:flex-row print:items-center"}
                ${description ? "p-4" : "px-4 py-2 items-center h-12"}
                ${index === undefined ? (isVisible ? "translate-y-0" : "translate-y-10") : ""}
                ${className ? className : "flex-col"}
                print:gap-1 print:p-2 print:rounded-none print:border-none print:translate-y-0 print:items-start print:text-sm
            `}
            style={{
                animationDuration: `${index !== undefined ? "1s !important" : 0}`,
            }}
        >
            <b className={`text-lg print:text-base print:font-bold flex items-center gap-2 h-full print:gap-1 print:items-center ${titleClassName ? titleClassName : "justify-center"}`}>
                {icon}
                <p>{title}</p>
                {url && <span aria-hidden="true" className="hidden print:inline print:text-xs print:ml-1 font-normal italic">{url}</span>}
            </b>
            {description && <Separator size="medium" className="hidden md:block print:hidden" />}
            {description && <p className="print:text-sm print:mt-0 print:mb-0 text-muted dark:text-muted-dark">
                <span className="hidden print:inline">
                    {"— "}
                </span>
                {description}
            </p>}
            {url && <ArrowSquareOutIcon className="print:hidden hidden md:block" />}
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