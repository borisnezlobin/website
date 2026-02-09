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
import { getBlog, getSimilarPosts } from "@/app/lib/db-caches";
import { DraftBadge } from "@/app/components/draft-badge";
import { Wrapper } from "@/app/(mywebsite)/notes/[slug]/[section]/skibidiwrapper";
import { getBlogHTMLPath } from "@/app/utils/get-note-mdx-path";
import { readFileSync } from "fs";
import { formatDateWithOrdinal } from "@/app/utils/format-date";
import { Metadata } from "next";
import { ScrollForMore } from "@/app/components/landing/scroll-for-more";
import { CaretDoubleDownIcon } from "@phosphor-icons/react/dist/ssr";
import { ViewCounter } from "./view-counter";
import BackToRouteLink from "@/app/components/back-to-route";

type BlogPageParams = {
    slug: string;
}

export async function generateStaticParams() {
    // Skip static generation if database isn't available (e.g., during Vercel builds)
    if (!process.env.POSTGRES_URL_NON_POOLING) {
        console.log("Database not available, skipping static params generation");
        return [];
    }

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
    let content = "";
    if (blogPost.remoteURL) {
        console.log("Blog post has remote URL, fetching content from", blogPost.remoteURL);
        content = await (await fetch(blogPost.remoteURL)).text();
        console.log("Fetched remote content for blog post", slug);
    } else {
        content = readFileSync(path, 'utf-8');
    }
    blogPost.body = content;

    return {
        post: blogPost,
        similarPosts: similarPosts
    };
}

export async function generateMetadata({ params }: { params: Promise<BlogPageParams> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlog(slug);

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
export default async function SingleBlogPage(
  { params }: { params: Promise<BlogPageParams> }
) {
    const { slug } = await params;
    console.log("Rendering blog post", slug);
    const { post, similarPosts } = await getDataForSlug(slug);

    if (!post) {
        return <NotFoundPage title="Blog post not found" />;
    }
    
    return (
        <>
            {slug.includes("draft-") && <DraftBadge />}
            <div className={`pagepad`}>
                {post.image && <ArticleImageBg imageUrl={post.image} />}
                <div className="absolute top-16 left-8">
                    <BackToRouteLink href="/blog" className="gap-2 flex flex-row items-center justify-center hover:underline hover:text-primary dark:hover:text-primary-dark" text="All articles" />
                </div>
                
                <div className={`flex flex-col ${post.image && "min-h-screen relative -top-20"}`}>
                    {post.image && <div className="flex-grow-[0.9]"></div>}
                    <header
                        className={`
                            gap-3 z-[1] flex flex-col justify-start items-center p-0
                            ${post.image ? "rounded shadow bg-light-background dark:bg-dark-background print:mt-0 md:items-center p-4 md:p-8" : "mt-8 md:p-0 max-w-2xl mx-auto"}
                        `}
                    >
                        <h1 className={`text-[1.75rem] font-bold md:font-normal md:text-2xl bg-transparent dark:bg-transparent w-full text-center print:text-left text-[#191919] dark:text-[#fafafa] print:dark:text-[#101010]`}>
                            {post.title}
                        </h1>
                        <p className={`bg-transparent dark:bg-transparent print:text-left ${!post.image ? "text-left mt-8" : "text-center"}`}>
                            {post.description}
                        </p>
                        <p className="hidden print:block mt-4 italic !text-muted">
                            By Boris Nezlobin
                        </p>
                    </header>
                </div>
                <div
                    className={`z-[1] w-full justify-center items-center relative mb-8 p-0 md:p-8 rounded-lg bg-background ${!post.image ? "mt-2 md:pt-0" : "md:pt-0"}`}
                >
                    <div
                        className={`z-[1] max-w-2xl ml-auto mr-auto relative w-full p-0 ${!post.image && "md:pt-8"} rounded-lg bg-background`}
                    >
                        <span className="text-muted dark:text-muted-dark font-normal flex items-center gap-3 flex-wrap">
                            <span className="text-muted dark:text-muted-dark italic">
                                Published {formatDateWithOrdinal(new Date(post.createdAt))}
                            </span>
                            <ViewCounter slug={post.slug} />
                        </span>
                        <Wrapper content={post.body} />
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
