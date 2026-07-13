import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../../lib/metadata";
import { getBlogs } from "../../lib/db-caches";
import { paramToCategory } from "./categories";

export const metadata: Metadata = getMetadata({
    title: "Writing",
    info: "Portfolio",
    description: "Read my articles about software engineering, my life, education, and more.",
    subtitle: "I'm a writer, et cetera.",
});

const BlogPage = async ({ searchParams }: { searchParams: Promise<{ category?: string }> }) => {
    const posts = await getBlogs();
    const { category } = await searchParams;

    return (
        <BlogList
            articles={posts}
            initialCategory={paramToCategory(category)}
        />
    );
};

export default BlogPage;