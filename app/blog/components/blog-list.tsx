import { Article } from "@prisma/client";
import { SearchBar } from "../[slug]/search-bar";
import Link from "next/link";
import BlogListItem from "./blog-list-item";
import RandomQuote from "./random-quote";

const BlogList = ({
    articles,
    title,
    query = "",
}: {
    articles: Article[];
    title: string;
    query?: string;
}) => {
    return (
        <div
            className="min-h-[100svh] print:min-h-0 w-full p-8 pt-0 text-light-foreground dark:text-dark-foreground"
            suppressHydrationWarning
        >
            <h1 className="text-3xl emph mt-8 mb-4">{title ? title : "My Blog"}</h1>
            <SearchBar query={query}>
                <p className="text-muted dark:text-muted-dark print:mb-4">
                {query && (
                    <>
                    <Link
                        href="/blog"
                        className="link font-semibold"
                        title="Clear search"
                    >
                        Clear search
                    </Link>
                    <span className="text-muted dark:text-muted-dark">{" • "}</span>
                    </>
                )}
                Showing {articles.length} post{articles.length == 1 ? " " : "s "}
                </p>
            </SearchBar>
            <RandomQuote />
            {articles.map((post) => (
                <BlogListItem post={post} inGrid={false} key={post.id} />
            ))}
        </div>
    );
};

export default BlogList;
