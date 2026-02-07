"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import HorizontalScroll from "../scroll-horizontal";
import { LandingPageBadge } from "../landing-page-badge";

const projects = [
    {
        title: "ENF",
        description: "Free European electrical network frequency data.",
        badge: "Featured by Hack Club",
        url: "/projects/enf",
    },
    {
        title: "rendr",
        description: "3D renderer and raytracer in C.",
        badge: "CS Capstone",
        url: "/projects/rendr",
    },
    {
        title: "The C.H.",
        description: "Style code comments in VS Code.",
        url: "https://marketplace.visualstudio.com/items?itemName=randomletters.the-comment-highlighter",
    },
    {
        title: "Lim",
        description: "Track website usage. Set daily limits.",
        url: "/projects/lim",
    },
];

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" },
];

const lockheedChips = ["Solar data analysis", "OpenCV", "980x faster CSV reads"];

export function ProgrammerSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    return (
        <section className="min-h-[100svh] flex flex-col justify-center print:hidden">
            <div
                ref={ref}
                className={`max-w-6xl mx-auto px-8 w-full flex flex-col md:flex-row gap-8 md:gap-12 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <SectionLabel label="Programmer" />

                <div className="flex-1 flex flex-col gap-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {projects.map((project) => (
                            <Link
                                key={project.title}
                                href={project.url}
                                target={project.url.startsWith("http") ? "_blank" : undefined}
                                rel={project.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="group flex flex-col gap-3 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:scale-[1.02] transition-transform duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">{project.title}</h3>
                                    {project.badge && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                            {project.badge}
                                        </span>
                                    )}
                                    <ArrowSquareOutIcon
                                        size={16}
                                        className="ml-auto text-muted dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    />
                                </div>
                                <p className="text-muted dark:text-muted-dark text-sm">
                                    {project.description}
                                </p>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <div className="flex-shrink-0">
                            <span className="font-bold text-lg">Lockheed Martin</span>
                            <p className="text-muted dark:text-muted-dark text-xs">Software Engineering Intern</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {lockheedChips.map((chip) => (
                                <span
                                    key={chip}
                                    className="text-xs px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 text-muted dark:text-muted-dark"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="emph text-sm tracking-wider text-muted dark:text-muted-dark uppercase">
                            Open Source
                        </h3>
                        <HorizontalScroll>
                            {contributions.map((c, i) => (
                                <LandingPageBadge
                                    title={c.title}
                                    description={c.description}
                                    key={`contribution ${i}`}
                                    url={c.url}
                                    className="inline-block w-max flex-shrink-0 flex-row items-center"
                                    index={i}
                                />
                            ))}
                        </HorizontalScroll>
                    </div>
                </div>
            </div>
        </section>
    );
}
