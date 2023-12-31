"use client";

import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";

const ProjectLink = ({ link }: { link: string }) => {
    const host = link.split("/")[2].split(".")[0];
    if(link.includes(window.location.hostname)){

        return (
            <Link href={link} className="group">
                <p className="text-base font-bold cursor-pointer">
                    Related Article
                </p>
                <p className="link flex flex-row gap-2 justify-center items-center">
                    {link}
                    <ArrowRight className="" weight="bold" />
                </p>
            </Link>
        );
    }

    return (
        <Link className="group" href={link} target="_blank">
            <p className="text-base font-bold cursor-pointer">
                {host.slice(0, 1).toUpperCase() + host.slice(1)}
            </p>
            <p className="link flex flex-row gap-2 justify-center items-center">
                {link}
                <ArrowSquareOut className="" weight="bold" />
            </p>
        </Link>
    );
}

export { ProjectLink };