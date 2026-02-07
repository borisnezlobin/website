"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import HorizontalScroll from "../scroll-horizontal";
import { LandingPageBadge } from "../landing-page-badge";
import { Separator } from "../../separator";

const currentProjects = [
    {
        title: "The JYV",
        url: "https://thejyv.com",
        description: "A website I built end-to-end (with admin dashboard!) for The Journal For Youth Voice.",
    }, {
        title: "ENF",
        url: "/projects/enf",
        description: "The only free, up-to-date European electrical network frequency data.",
        badge: "Featured by Hack Club!",
    },
];

const pastProjects = [
    { title: "rendr", description: "3D renderer + raytracer in C", url: "/projects/rendr" },
    { title: "The C.H.", description: "Style code comments in VS Code", url: "https://marketplace.visualstudio.com/items?itemName=randomletters.the-comment-highlighter" },
    { title: "Lim", description: "Track website usage, set daily limits", url: "/projects/lim" },
];

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" },
];

const lockheedChips = ["Solar data analysis", "OpenCV", "Data Science", "*980x faster CSV reads"];

export function ProgrammerSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    return (
        <section className="landing-section !min-h-0 pt-24 md:pt-32">
            <div
                ref={ref}
                className={`max-w-6xl mx-auto px-8 w-full flex flex-col md:flex-row gap-8 md:gap-12 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <div className="flex-1 flex flex-col gap-16">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-start">
                            <span className="vectra text-5xl md:text-7xl leading-tight">
                                Building things.
                            </span>
                            <p className="text-muted dark:text-muted-dark mt-3 max-w-2xl">
                                I’m a programmer (in case that wasn’t obvious). I build things for fun, often, and focus on building things that are useful to other people.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6">
                            {currentProjects.map((project) => (
                                <Link
                                    key={project.title}
                                    href={project.url}
                                    target={project.url.startsWith("http") ? "_blank" : undefined}
                                    rel={project.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-xl group-hover:text-primary transition-colors duration-200">
                                            {project.title}
                                        </span>
                                    </div>
                                    <span className="text-muted dark:text-muted-dark text-sm md:text-base">
                                        {project.description}
                                    </span>
                                    {project.badge && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                            {project.badge}
                                        </span>
                                    )}
                                    <ArrowSquareOutIcon
                                        size={16}
                                        className="hidden md:block ml-auto text-muted dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-0">
                        <p className="emph text-sm tracking-wider text-muted dark:text-muted-dark uppercase mb-4">
                            Past Projects
                        </p>
                        {pastProjects.map((project) => (
                            <Link
                                key={project.title}
                                href={project.url}
                                target={project.url.startsWith("http") ? "_blank" : undefined}
                                rel={project.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="group flex flex-row items-center gap-4 py-3 border-b border-neutral-200 dark:border-neutral-800 first:border-t"
                            >
                                <span className="font-semibold group-hover:text-primary transition-colors duration-200 w-32">
                                    {project.title}
                                </span>
                                <span className="text-muted dark:text-muted-dark text-sm flex-1 min-w-0 truncate">
                                    {project.description}
                                </span>
                                <ArrowRightIcon
                                    weight="bold"
                                    size={14}
                                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                                />
                            </Link>
                        ))}
                        <Link href="/projects" className="mt-4 text-sm text-primary font-semibold hover:underline flex items-center gap-2">
                            All projects <ArrowRightIcon weight="bold" size={14} />
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="emph text-sm tracking-wider text-muted dark:text-muted-dark uppercase mb-2">
                            Industry
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <span className="font-bold text-lg">Lockheed Martin</span>
                            <Separator className="block md:hidden" vertical />
                            <Separator className="hidden md:block" />
                            <div className="flex flex-wrap gap-2">
                                {lockheedChips.map((chip) => (
                                    <span
                                        key={chip}
                                        className={`text-xs px-3 py-1 rounded-full border ${chip.startsWith("*") ? "border-primary dark:border-primary-dark text-primary dark:text-primary-dark" : "border-neutral-300 dark:border-neutral-700 text-muted dark:text-muted-dark"}`}
                                    >
                                        {chip.startsWith("*") ? (
                                            <em>{chip.slice(1)}</em>
                                        ) : (
                                            chip
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="emph text-sm tracking-wider text-muted dark:text-muted-dark uppercase">
                            Open Source
                        </p>
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
            <SectionLabel label="Programmer" />
        </section>
    );
}
