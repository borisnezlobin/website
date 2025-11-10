import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../../lib/metadata";
import { getBlogs } from "../../lib/db-caches";

export const metadata: Metadata = getMetadata({
    title: "Writing",
    description: "Read my articles about software engineering, my life, education, and more.",
    subtitle: "I'm a writer, et cetera.",
});

const BlogPage = async () => {
    const posts = await getBlogs();

    return (
        <BlogList articles={posts} />
    );
};

export default BlogPage;