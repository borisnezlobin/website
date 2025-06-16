import { formatDateWithOrdinal } from "@/app/utils/format-date";
import { Article } from "@prisma/client";

const ArticleDate = ({ article, className, containerClass }: { article: Article, className?: string, containerClass?: string }) => {
    return (
        <div className={"flex justify-between " + containerClass}>
            <time className={`${!className || !className.includes("text") ? "text-muted dark:text-muted-dark" : ""} ${className}`}>
                {formatDateWithOrdinal(new Date(article.createdAt))}
            </time>
        </div>
    )
};

export { ArticleDate };