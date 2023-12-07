import { Article } from "@prisma/client";
import { SearchBar } from "../[slug]/components";
import Link from "next/link";
import BlogListItem from "./blog-list-items";

const BlogList = ({ articles, title, query = "" }: { articles: Article[], title: string, query?: string }) => {
    return (
        <div className="min-h-screen w-screen p-8 text-light-foreground dark:text-dark-foreground" suppressHydrationWarning>
            <h1 className="text-3xl">{title ? title : "Blog"}</h1>
            <p className="mt-1">Read my blog posts about software engineering, web development, and more!</p>
            <SearchBar query={query}/>
            <p className="mt-1 text-muted dark:text-muted-dark">
                {query && (
                    <>
                        
                        <Link href="/blog" className="link font-semibold">
                            Clear search
                        </Link>
                        <span className="text-muted dark:text-muted-dark">
                            {" • "}
                        </span>
                    </>
                )}
                Showing {articles.length} post{articles.length == 1 ? " " : "s "}
                <span className="text-muted dark:text-muted-dark">
                    {" • "}
                </span>
                <Link href="/blog/tags" className="link">
                    Explore all
                </Link>
            </p>
            {articles.map((post) => (
                // all my homies love
                // @ts-ignore
                <BlogListItem post={post} tags={post.tags ? post.tags : []} key={post.id} />
            ))}
        </div>
    );
}

export default BlogList;