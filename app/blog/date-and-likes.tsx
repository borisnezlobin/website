import { Article } from "@prisma/client";

const DateAndLikes = ({ article, className }: { article: Article, className?: string }) => {
    return (
        <div className="flex justify-between">
            <p className={"text-muted dark:text-muted-dark " + className}>
                {article.createdAt.toLocaleDateString()}
                {article.likes > 0 ?
                " • " + article.likes + " like" + (article.likes === 1 ? "" : "s")
                : ""
                }
            </p>
        </div>
    )
};

export { DateAndLikes };