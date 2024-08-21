import db from "../lib/db";
import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../lib/metadata";

export const metadata: Metadata = getMetadata({
    title: "My Blog",
    description: "Read my blog posts about software engineering, everyday life, and more!",
});


const BlogPage = async () => {
    const posts = await db.article.findMany({
        orderBy: { createdAt: "desc" },
    });


    return (
        <BlogList articles={posts} title="My Blog" />
    );
};

export default BlogPage;