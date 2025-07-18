import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import {
    ArticleImageBg,
    TweetArticleButton,
} from "./components";
import ShareButton from "./share-button";
import getMetadata from "@/app/lib/metadata";
import { LinkButton } from "@/app/components/buttons";
import BlogListItem from "../components/blog-list-item";
import ArticleBody from "@/app/components/article-body";
import { getBlog, getSimilarPosts } from "@/app/lib/db-caches";
import { DraftBadge } from "@/app/components/draft-badge";
import { Wrapper } from "@/app/notes/[slug]/[section]/skibidiwrapper";
import { getBlogHTMLPath } from "@/app/utils/get-note-mdx-path";
import { readFileSync } from "fs";
import { formatDateWithOrdinal } from "@/app/utils/format-date";

export async function generateStaticParams() {
    const posts = await db.article.findMany({
        select: { slug: true },
    });

    console.log("\nGenerating paths for blog posts:", posts.map((post) => post.slug));

    return posts.map((post) => ({ params: { slug: post.slug } }));
}

async function getDataForSlug(slug: string) {
    console.log("Getting blog post", slug);
    let blogPost = await getBlog(slug);

    if (!blogPost) {
        console.log(`Blog post ${slug} not found`);
        return {
            notFound: true,
        };
    }

    const similarPosts = await getSimilarPosts(slug);

    // set post.body to be the content of the HTML file
    const path = getBlogHTMLPath(slug);
    const content = readFileSync(path, 'utf-8');
    blogPost.body = content;

    return {
        post: blogPost,
        similarPosts: similarPosts
    };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await getBlog(params.slug);

    if (!post) {
        return getMetadata({
            title: "Blog post not found.",
            info: "404",
            subtitle: "Boris Nezlobin.",
            description:
                "This blog post could not be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: post.title,
        info: new Date(post.createdAt).toLocaleDateString(),
        subtitle: "Boris Nezlobin.",
        description: `${new Date(post.createdAt).toLocaleDateString()} — ${post.description}`,
    });
}

//  { post, similarPosts }: InferGetStaticPropsType<typeof getStaticProps>
export default async function SingleBlogPage({ params }: { params: { slug: string } }) {
    console.log("Rendering blog post", params.slug);
    const { post, similarPosts } = await getDataForSlug(params.slug);

    if (!post) {
        return <NotFoundPage title="Blog post not found" />;
    }
    
    return (
        <>
            {params.slug.startsWith("draft") && <DraftBadge />}
            <div className={`min-h-[100svh] print:min-h-0 z-[1] w-full p-8 print:bg-white print:text-dark-background print:dark:bg-white print:dark:text-dark-background`}>
                {post.image && <ArticleImageBg imageUrl={post.image} />}
                <header
                    className={`
                        gap-3 rounded-lg z-[1] flex flex-col justify-start items-start p-0 duration-300 transition-all
                        ${post.image ? "backdrop-blur-none md:backdrop-blur-lg mt-[20rem] md:py-12 md:mt-0 bg-light-background/50 dark:bg-dark-background/50 print:mt-0 md:items-center md:p-4" : "md:p-0 md:mt-8 max-w-2xl mx-auto"}
                    `}
                >
                    <h1 className={`text-[1.75rem] font-bold md:font-normal md:text-4xl bg-transparent dark:bg-transparent w-full text-center max-w-2xl text-[#101010] dark:text-[#fafafa] print:dark:text-[#101010]`}>
                        {post.title}
                    </h1>
                    <p className={`bg-transparent dark:bg-transparent font-semibold print:text-left max-w-2xl ${!post.image ? "text-left mt-8" : "text-left md:text-center"}`}>
                        {post.description}
                    </p>
                </header>
                <div
                    className={`z-[1] w-full justify-center items-center relative mt-2 mb-8 p-0 md:p-8 rounded-lg ${!post.image ? "md:pt-0" : "md:pt-0"}`}
                >
                    <div
                        className={`z-[1] max-w-2xl ml-auto mr-auto relative w-full p-0 md:pt-8 rounded-lg`}
                    >
                        <span className="text-muted dark:text-muted-dark font-normal">
                            Published {formatDateWithOrdinal(new Date(post.createdAt))}&nbsp;&nbsp;
                        </span>
                        <Wrapper content={post.body} />
                        {/* <ArticleBody body={post.body} /> */}
                    </div>
                </div>
                {post && (
                    <div className="z-[1] flex flex-row justify-start items-center gap-2 print:hidden">
                        <p className="text-muted dark:text-muted-dark">Liked this article?</p>
                        <ShareButton />
                        <TweetArticleButton slug={post.slug} />
                    </div>
                )}
                <LinkButton
                    direction="left"
                    aria-label="Back to Blog"
                    className="mt-8 print:hidden"
                    href="/blog"
                >
                    Back to blog
                </LinkButton>

                <h2 className="text-2xl mt-12 print:hidden">More articles</h2>
                <div className="md:pl-8 print:hidden">
                    <ul>
                        {similarPosts.map((post) => (
                            <li key={post.id}>
                                <BlogListItem post={post} inGrid={false} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
