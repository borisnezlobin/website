"use client";

import { Article } from "@prisma/client";
import Link from "next/link";
import { ArticleDate } from "./article-date";

const BlogListItem = ({
    post,
    inGrid = false,
}: {
    post: Article;
    inGrid: boolean;
}) => (
    <div
        key={post.id}
        className={`${
        !inGrid
            ? "mt-8 cursor-pointer group"
            : "flex flex-shrink-0 relative group cursor-pointer flex-col gap-2 h-48 print:h-min min-w-64 max-w-[90vw] w-96 print:w-min p-4 print:p-0 border print:border-none border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 hover:dark:border-neutral-400 group rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px"
        }`}
    >
        <Link
            href={`/blog/${post.slug}`}
            suppressHydrationWarning
            title={post.title}
        >
            <div className="flex flex-col gap-1 mb-2 print:mb-0 md:flex-row justify-start items-start md:items-center md:gap-3 md:m-0">
                <h2 className="text-xl flex flex-row justify-start items-center header-link">
                    {post.title}
                </h2>
            </div>
            <p aria-hidden className="hidden print:block !text-muted dark:!text-muted-dark">
                https://borisn.dev/blog/{post.slug}
            </p>
            <p>{post.description}</p>
            <ArticleDate
                article={post}
                className="sm:opacity-0 group-hover:opacity-100 print:opacity-100"
            />
        </Link>
  </div>
);

export default BlogListItem;
