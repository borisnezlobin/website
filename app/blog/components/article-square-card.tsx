"use client"

import { Article } from "@prisma/client";
import Link from "next/link";
import { DateAndLikes } from "./date-and-likes";

const ArticleSquareCard = ({ article }: { article: Article }) => {
    return (
        <div className="flex flex-shrink-0 relative group cursor-pointer flex-col gap-2 h-48 min-2-96 w-96 p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px border-muted dark:border-muted-dark">
            <Link href={`/blog/${article.slug}`} aria-label={article.title}>
                <h2 className="text-xl flex flex-row header-link justify-start items-center">
                    {article.title}
                </h2>
                <p>{article.description}</p>
                <DateAndLikes article={article} className="sm:opacity-0 group-hover:opacity-100" />
            </Link>
        </div>
    );
}

export default ArticleSquareCard;