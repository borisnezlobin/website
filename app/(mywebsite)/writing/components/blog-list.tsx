"use client";

import { Article, ArticleCategory } from "@/prisma/awooga/client";
import BlogListItem from "./blog-list-item";
import RandomQuote from "./random-quote";
import { useState } from "react";
import { InkscapeColoredSvg } from "@/app/utils/inkscape-colored-svg";

const activeTab =
    "bg-primary dark:bg-primary-dark text-light-background dark:text-dark-background border-primary dark:border-primary-dark";
const inactiveTab =
    "hover:bg-light-foreground/10 dark:hover:bg-dark-foreground/10 border-muted-dark/50 dark:border-muted/50";

const BlogList = ({
    articles,
    title,
}: {
    articles: Article[];
    title?: string;
}) => {
    const [category, setCategory] = useState<ArticleCategory>("TECHNICAL");

    // Non-technical tabs get the hand-drawn flourish; only Personal gets the slice shader.
    const flourish = category !== "TECHNICAL";
    const sliced = category === "PERSONAL";

    return (
        <div className="pagepad" suppressHydrationWarning>
            {title ? (
                <h1 className="text-3xl mt-8 mb-4">{title}</h1>
            ) : (
                <h1 className="text-3xl mt-8 mb-6 font-normal">
                    My&nbsp;
                    <span className="text-5xl vectra relative">
                        Writing.
                        <InkscapeColoredSvg
                            strokeWidth={0.9}
                            speed={250}
                            path="/drawings/underline.svg"
                            color="var(--text-color)"
                            className="absolute w-[120%] top-[0.825em] left-0"
                            visible={flourish}
                        />
                    </span>
                </h1>
            )}

            <RandomQuote visible={flourish} sliced={sliced} />

            <div className="mt-12 w-full flex flex-row items-center justify-center mb-6 print:hidden">
                <div className="rounded flex flex-row items-center justify-center relative">
                    <InkscapeColoredSvg
                        strokeWidth={1.0}
                        speed={75}
                        path="/drawings/technicalcreativewrapper.svg"
                        color="var(--primary)"
                        className="absolute pointer-events-none z-10 w-[129%] translate-y-px right-[-2px]"
                        visible={flourish}
                    />
                    <button
                        className={`px-4 py-1 rounded-l border ${category === "TECHNICAL" ? activeTab : inactiveTab}`}
                        onClick={() => setCategory("TECHNICAL")}
                    >
                        Technical
                    </button>
                    <button
                        className={`relative -left-px px-4 py-1 border ${category === "CREATIVE" ? activeTab : inactiveTab}`}
                        onClick={() => setCategory("CREATIVE")}
                    >
                        Creative
                    </button>
                    <button
                        className={`relative -left-[2px] px-4 py-1 rounded-r border ${category === "PERSONAL" ? activeTab : inactiveTab}`}
                        onClick={() => setCategory("PERSONAL")}
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
