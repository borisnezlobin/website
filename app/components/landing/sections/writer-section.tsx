"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon, PenNibIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";

type ArticlePreview = {
    title: string;
    description: string;
    slug: string;
    createdAt: Date;
};

const curatedDescriptions: Record<string, string> = {
    "macports-with-proxy": "Getting MacPorts to cooperate behind a corporate proxy at Lockheed Martin.",
    "kalman-filters": "An intuitive derivation of the Kalman filter, from first principles.",
    "react-server-components": "Why React Server Components matter, and how to think about them.",
};

export function WriterSection({ articles }: { articles: ArticlePreview[] }) {
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
                <SectionLabel label="Writer" />

                <div className="flex-1 flex flex-col gap-12">
                    <blockquote className="border-l-2 border-primary pl-6 py-2">
                        <p className="vectra text-2xl md:text-3xl leading-relaxed">
                            I think the best way to learn something is to write about it—badly at first, then less badly, then well enough that someone else can learn from it too.
                        </p>
                    </blockquote>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {articles.slice(0, 3).map((article) => (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group flex flex-col gap-3 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary dark:hover:border-primary transition-colors duration-200"
                            >
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
                                    {article.title}
                                </h3>
                                <p className="text-muted dark:text-muted-dark text-sm leading-relaxed">
                                    {curatedDescriptions[article.slug] || article.description || ""}
                                </p>
                                <span className="mt-auto flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    Read <ArrowRightIcon weight="bold" size={14} />
                                </span>
                            </Link>
                        ))}
                    </div>

                    <Link href="/write" className="block w-full">
                        <div className="relative w-full group p-6 md:p-8 rounded-lg bg-dark-background dark:bg-light-background transition-transform duration-200 hover:scale-[1.01]">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <PenNibIcon
                                    size={32}
                                    weight="duotone"
                                    className="text-dark-foreground dark:text-light-foreground"
                                />
                                <div className="flex-1">
                                    <h3 className="vectra text-xl text-dark-foreground dark:text-light-foreground">
                                        Try Wrisk.
                                    </h3>
                                    <p className="text-dark-foreground/70 dark:text-light-foreground/70 text-sm mt-1">
                                        Write until your time runs out or you hit your word count. You won&apos;t be able to stop.
                                    </p>
                                </div>
                                <ArrowRightIcon
                                    size={20}
                                    weight="bold"
                                    className="text-dark-foreground dark:text-light-foreground hidden md:block group-hover:translate-x-1 transition-transform duration-200"
                                />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
