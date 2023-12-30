"use client"

import { Article, Tag } from "@prisma/client";
import Link from "next/link";
import { DateAndLikes } from "./date-and-likes";
import Badge from "@/app/components/badge";
import TagBadge from "../tag/tag-badge";

const ArticleSquareCard = ({ article }: { article: Article }) => {
    return (
        <div className="flex flex-shrink-0 relative group cursor-pointer flex-col gap-2 h-48 min-2-96 w-96 p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px border-muted dark:border-muted-dark">
            <Link href={`/blog/${article.slug}`}>
                <h2 className="text-xl flex flex-row header-link justify-start items-center">
                        {article.title}
                </h2>
                <p>{article.description}</p>
                <DateAndLikes article={article} className="sm:opacity-0 group-hover:opacity-100" />
            </Link>
            <div className="flex flex-row justify-start items-center absolute bottom-2">
                {/* @ts-ignore */}
                {article.tags && article.tags.map((tag: Tag) => <TagBadge tag={tag} key={tag.id} />)}
            </div>
        </div>
    );
}

export default ArticleSquareCard;