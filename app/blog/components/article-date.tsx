import { Article } from "@prisma/client";

const ArticleDate = ({ article, className, containerClass }: { article: Article, className?: string, containerClass?: string }) => {
    return (
        <div className={"flex justify-between " + containerClass}>
            <time className={`${!className || !className.includes("text") ? "text-muted dark:text-muted-dark" : ""} ${className}`}>
                {new Date(article.createdAt).toLocaleDateString()}
            </time>
        </div>
    )
};

export { ArticleDate };