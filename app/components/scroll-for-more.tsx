"use client"
import { ArrowFatLineDown } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

const ScrollForMore = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        window.addEventListener("scroll", (e) => {
            setScrolled(window.scrollY > window.innerHeight * 0.05);
        })
    }, []);

    return <div className={` absolute bottom-0 left-0 flex flex-col gap-2 justify-end items-center pb-2`}>
        <div className={`${scrolled ? "opacity-0" : "visible"} flex flex-row justify-center items-center w-screen gap-4 text-muted dark:text-muted-dark`}>
            <p className="text-muted dark:text-muted-dark">Scroll for more</p>
            <ArrowFatLineDown size={24} weight="thin" />
        </div>
        <hr className="w-screen" />
    </div>
}

export { ScrollForMore };