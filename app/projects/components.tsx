"use client";

import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";

const ProjectLink = ({ link }: { link: string }) => {
    const host = link.split("/")[2].split(".")[0];
    if(typeof window !== "undefined" && link.includes(window.location.hostname)){
        return (
            <div>
                <p className="text-base font-bold">
                    Related Article
                </p>
                <Link aria-label="Related Article" href={link} className="link md:ml-4 flex flex-row gap-2 justify-center items-center">
                    {link}
                    <ArrowRight className="" weight="bold" />
                </Link>
            </div>
        );
    }

    return (
        <div >
            <p className="text-base font-bold">
                {host.slice(0, 1).toUpperCase() + host.slice(1)}
            </p>
            <Link aria-label={host} href={link} target="_blank" className="link md:ml-4 flex flex-row gap-2 justify-center items-center">
                {link}
                <ArrowSquareOut className="" weight="bold" />
            </Link>
        </div>
    );
}

export { ProjectLink };