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
    title?: string;
    query?: string;
}) => {
    return (
        <div
            className="pagepad"
            suppressHydrationWarning
        >
            {title ?
                <h1 className={`text-3xl mt-8 mb-4`}>{title}</h1>
            : (
                <h1 className={`text-3xl mt-8 mb-12 font-normal`}>
                    My&nbsp;
                    <span className="text-5xl vectra">Writing.</span>
                </h1>
            )}
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
                Showing {articles.length} article{articles.length == 1 ? " " : "s "}
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
