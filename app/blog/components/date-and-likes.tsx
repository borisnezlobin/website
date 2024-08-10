import { Article } from "@prisma/client";

const DateAndLikes = ({ article, className, containerClass }: { article: Article, className?: string, containerClass?: string }) => {
    return (
        <div className={"flex justify-between " + containerClass}>
            <p className={`${!className || !className.includes("text") ? "text-muted dark:text-muted-dark" : ""} ${className}`}>
                <time>{article.createdAt.toLocaleDateString()}</time>
                <span className="print:hidden">
                {article.likes > 0 ?
                " • " + article.likes + " like" + (article.likes === 1 ? "" : "s")
                : ""
                }
                </span>
            </p>
        </div>
    )
};

export { DateAndLikes };