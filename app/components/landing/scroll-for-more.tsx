"use client"
import { ArrowFatLineDownIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

const ScrollForMore = ({ className = "", text }: { className?: string, text?: string }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        window.addEventListener("scroll", (e) => {
            setScrolled(window.scrollY > window.innerHeight * 0.05);
        })
    }, []);

    return <div className={`print:hidden absolute bottom-0 left-0 flex flex-col gap-2 justify-end items-center pb-1 ${className}`}>
        <div className={`${scrolled ? "opacity-0" : ""} print:opacity-100 flex flex-row justify-center items-center print:items-end w-screen gap-4 text-muted dark:text-muted-dark`}>
            <p className="text-muted dark:text-muted-dark block print:hidden">
                {text || "Scroll for more"}
            </p>
            <p aria-hidden className="text-muted dark:text-muted-dark hidden print:block">
                More
            </p>
            <ArrowFatLineDownIcon size={24} weight="thin" className="animate-bounce print:animate-none" />
        </div>
        <div className="h-[1px] !bg-[#dddddd] dark:!bg-[#444] w-screen"/>
    </div>
}

export { ScrollForMore };