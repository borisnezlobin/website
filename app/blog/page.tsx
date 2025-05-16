import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../lib/metadata";
import { getBlogs } from "../lib/db-caches";

export const metadata: Metadata = getMetadata({
    title: "Blog",
    description: "Read my blog posts about software engineering, everyday life, and more!",
    subtitle: "Software engineering, education, and more.",
});

const BlogPage = async () => {
    const posts = await getBlogs();

    return (
        <BlogList articles={posts} title="My Blog" />
    );
};

export default BlogPage;