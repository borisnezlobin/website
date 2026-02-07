"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import { Separator } from "../../separator";

type ArticlePreview = {
    title: string;
    description: string;
    slug: string;
    createdAt: Date;
};

export function WriterSection({ articles }: { articles: ArticlePreview[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    return (
        <section className="landing-section">
            <div
                ref={ref}
                className={`max-w-6xl mx-auto px-8 w-full flex flex-col md:flex-row gap-8 md:gap-12 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <div className="flex-1 flex flex-col gap-10">
                    <div className="flex flex-col items-start">
                        <span className="vectra text-5xl md:text-8xl leading-none">
                            I write things.
                        </span>
                        <p className="text-muted dark:text-muted-dark mt-4 max-w-lg">
                            Sometimes I try to change the world—I helped reinstate multivariable calculus at my school with my writing!—and other times I
                            write about the Technical Challenges of being a programmer.
                        </p>
                    </div>

                    <div className="flex flex-col gap-0">
                        {articles.slice(0, 3).map((article, i) => (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group flex flex-row items-baseline gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 first:border-t"
                            >
                                <span className="emph text-muted dark:text-muted-dark text-sm tabular-nums">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="font-semibold text-lg group-hover:text-primary transition-colors duration-200 flex-1 min-w-0 truncate">
                                    {article.title}
                                </span>
                                <ArrowRightIcon
                                    weight="bold"
                                    size={14}
                                    className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
                                />
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Link href="/blog" className="text-primary font-semibold hover:underline flex items-center gap-2">
                            All articles <ArrowRightIcon weight="bold" size={14} />
                        </Link>
                        <Separator className="hidden sm:flex" />
                        <Link href="/write" className="text-muted dark:text-muted-dark hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                            Wrisk, the free tool I made to help me write faster
                            <ArrowRightIcon weight="bold" size={14} className="flex-shrink-0" />
                        </Link>
                    </div>
                </div>
            </div>
            <SectionLabel label="Writer" />
        </section>
    );
}
