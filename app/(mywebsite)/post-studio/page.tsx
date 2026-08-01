import { Metadata } from "next";
import { getBlogs } from "@/app/lib/db-caches";
import { devOnly } from "@/app/lib/dev-only";
import { PostStudio, type StudioArticle } from "./post-studio";

export const metadata: Metadata = {
    title: "Post studio",
    robots: { index: false, follow: false },
};

export default async function PostStudioPage() {
    devOnly();
    const posts = await getBlogs();
    const articles: StudioArticle[] = posts.map((p) => ({
        title: p.title,
        description: p.description,
        category: p.category,
        slug: p.slug,
    }));

    return <PostStudio articles={articles} />;
}
