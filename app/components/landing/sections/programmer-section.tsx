"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import HorizontalScroll from "../scroll-horizontal";
import { LandingPageBadge } from "../landing-page-badge";
import { Chip } from "../chip";

const currentProjects = [
    {
        title: "The JYV",
        url: "https://thejyv.com",
        description: "A website I built & designed end-to-end for The Journal For Youth Voice. Also led migration.",
    }, {
        title: "ENF",
        url: "/projects#enf",
        description: "The only free, up-to-date European electrical network frequency data.",
        badge: "Featured by Hack Club!",
    },
];

const pastProjects = [
    { title: "rendr", description: "3D renderer + raytracer in C", url: "/projects#rendr" },
    {
        title: "Amelia",
        description: "Version control for human context: who spoke, what they said, and what changed since",
        url: "https://www.linkedin.com/feed/update/urn:li:activity:7493895992778358784/",
        won: "Hackathon win",
    },
    {
        title: "Standard Physics",
        description: "Scan a shop with an iPhone and see every ADA and building-code problem on a 3D model",
        url: "https://www.linkedin.com/feed/update/urn:li:activity:7505484140780281856/",
        won: "Hackathon win",
    },
];

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" },
];

const lockheedWork = [
    { label: "Solar data analysis" },
    { label: "OpenCV" },
    { label: "Data science" },
    { label: "980x faster CSV reads", highlight: true },
];

const freelanceClients = [
    { label: "G Studio Productions", url: "https://g.studio" },
    { label: "Palo Alto Stanford Aquatics", url: "https://pasa-rinconada.org" },
];

export function ProgrammerSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    return (
        <section className="landing-section !min-h-0 pt-32 md:pt-40 pb-6 md:pb-8">
            <div
                ref={ref}
                className={`max-w-6xl mx-auto px-8 w-full flex flex-col gap-20 md:gap-28 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <div className="flex flex-col gap-10">
                    <h2 className="vectra text-5xl md:text-7xl leading-tight text-muted dark:text-muted-dark">
                        Building things.
                    </h2>

                    <div className="flex flex-col gap-8">
                        {currentProjects.map((project) => (
                            <Link
                                key={project.title}
                                href={project.url}
                                {...externalLinkProps(project.url)}
                                className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-6"
                            >
                                <span className="font-bold text-xl group-hover:text-primary transition-colors duration-200">
                                    {project.title}
                                </span>
                                <span className="text-muted dark:text-muted-dark text-sm md:text-base">
                                    {project.description}
                                </span>
                                {project.badge && <Chip highlight className="self-start">{project.badge}</Chip>}
                                <ArrowSquareOutIcon
                                    size={16}
                                    className="hidden md:block ml-auto text-muted dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                                />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-0">
                    {pastProjects.map((project) => (
                        <Link
                            key={project.title}
                            href={project.url}
                            {...externalLinkProps(project.url)}
                            className="group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 first:border-t w-full min-w-0"
                        >
                            <span className="font-semibold group-hover:text-primary transition-colors duration-200 sm:w-44 sm:flex-shrink-0">
                                {project.title}
                            </span>
                            <span className="text-muted dark:text-muted-dark text-sm flex-1 min-w-0">
                                {project.description}
                            </span>
                            {project.won && <Chip highlight className="flex-shrink-0">{project.won}</Chip>}
                            <ArrowRightIcon
                                weight="bold"
                                size={14}
                                className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                            />
                        </Link>
                    ))}
                    <Link href="/projects" className="mt-8 text-sm text-primary font-semibold hover:underline flex items-center gap-2">
                        See all projects <ArrowRightIcon weight="bold" size={14} />
                    </Link>
                </div>

                <div className="flex flex-col gap-6">
                    <h3 className="text-sm text-muted dark:text-muted-dark font-normal">
                        Experience
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="font-bold text-lg sm:mr-4">Lockheed Martin</span>
                        <div className="flex flex-wrap gap-2">
                            {lockheedWork.map((work) => (
                                <Chip key={work.label} highlight={work.highlight}>
                                    {work.label}
                                </Chip>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
                        <span className="text-muted dark:text-muted-dark">Nowadays, I freelance as a photographer and web developer:</span>
                        <div className="flex flex-wrap gap-2">
                            {freelanceClients.map((client) => (
                                <Chip key={client.label}>
                                    {client.url ? (
                                        <Link href={client.url} target="_blank" rel="noopener noreferrer" className="flex flex-row gap-1 items-center hover:underline">
                                            {client.label}
                                            <ArrowSquareOutIcon size={12} className="inline-block ml-1" />
                                        </Link>
                                    ) : client.label}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <h3 className="text-sm text-muted dark:text-muted-dark font-normal">
                        Open source
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
        </section>
    );
}

function externalLinkProps(url: string) {
    if (!url.startsWith("http")) return {};
    return { target: "_blank", rel: "noopener noreferrer" };
}
