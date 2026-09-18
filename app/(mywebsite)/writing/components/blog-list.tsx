"use client";

import { Article, ArticleCategory } from "@/prisma/awooga/client";
import BlogListItem from "./blog-list-item";
import WritingHero from "./writing-hero";
import { useEffect, useState } from "react";
import { InkscapeColoredSvg } from "@/app/utils/inkscape-colored-svg";
import { DEFAULT_CATEGORY, WRITING_CATEGORY_KEY, categoryToParam, paramToCategory, writingHref } from "../categories";

const activeTab =
    "bg-primary dark:bg-primary-dark text-light-background dark:text-dark-background border-primary dark:border-primary-dark";
const inactiveTab =
    "hover:bg-light-foreground/10 dark:hover:bg-dark-foreground/10 border-muted-dark/50 dark:border-muted/50";

const BlogList = ({
    articles,
    title,
    initialCategory = DEFAULT_CATEGORY,
}: {
    articles: Article[];
    title?: string;
    initialCategory?: ArticleCategory;
}) => {
    const [category, setCategory] = useState<ArticleCategory>(initialCategory);
    const flourish = category !== "TECHNICAL";
    const sliced = category === "PERSONAL";

    const persist = (cat: ArticleCategory) => {
        try { sessionStorage.setItem(WRITING_CATEGORY_KEY, categoryToParam(cat)); } catch { /* ignore */ }
    };
    useEffect(() => {
        const sync = () => {
            const next = paramToCategory(new URLSearchParams(window.location.search).get("category"));
            setCategory(next);
            persist(next);
        };
        sync();
        window.addEventListener("popstate", sync);
        return () => window.removeEventListener("popstate", sync);
    }, []);

    const selectCategory = (next: ArticleCategory) => {
        setCategory(next);
        persist(next);
        window.history.pushState(null, "", writingHref(next));
    };

    return (
        <div className="pagepad" suppressHydrationWarning>
            <WritingHero flourish={flourish} sliced={sliced} category={category} title={title} />

            <div className="mt-12 w-full flex flex-row items-center justify-center mb-6 print:hidden">
                <div className="rounded flex flex-row items-center justify-center relative">
                    <InkscapeColoredSvg
                        strokeWidth={1.0}
                        speed={75}
                        path="/drawings/technicalcreativewrapper.svg"
                        color="var(--primary)"
                        className="hidden md:block absolute pointer-events-none z-10 w-[115%] translate-y-px right-0"
                        visible={flourish}
                    />
                    <button
                        className={`px-4 py-1 rounded-l border ${category === "TECHNICAL" ? activeTab : inactiveTab}`}
                        onClick={() => selectCategory("TECHNICAL")}
                    >
                        Technical
                    </button>
                    <button
                        className={`relative -left-px px-4 py-1 border ${category === "CREATIVE" ? activeTab : inactiveTab}`}
                        onClick={() => selectCategory("CREATIVE")}
                    >
                        Creative
                    </button>
                    <button
                        className={`relative -left-[2px] px-4 py-1 rounded-r border ${category === "PERSONAL" ? activeTab : inactiveTab}`}
                        onClick={() => selectCategory("PERSONAL")}
                    >
                        Personal
                    </button>
                </div>
            </div>

            {articles.map((post) => {
                if (post.category !== category) return null;
                return <BlogListItem post={post} inGrid={false} key={post.id} />;
            })}
        </div>
    );
};

export default BlogList;
