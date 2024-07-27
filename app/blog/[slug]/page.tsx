import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import {
    ArticleImageBg,
    LikeButton,
    ShareButton,
    TweetArticleButton,
} from "./components";
import getMetadata from "@/app/lib/metadata";
import { DateAndLikes } from "../components/date-and-likes";
import { LinkButton } from "@/components/buttons";
import BlogListItem from "../components/blog-list-item";
import ArticleBody from "@/app/components/article-body";

export async function generateStaticParams() {
    const posts = await db.article.findMany({
        select: { slug: true },
    });

    console.log("Generating paths for blog posts:", posts);

    return posts.map((post) => ({ params: { slug: post.slug } }));
}

async function getDataForSlug(slug: string) {
    console.log("Getting blog post", slug);
    const blogPost = await db.article.findUnique({
        where: { slug },
        include: { tags: true },
    });

    if (!blogPost) {
        console.log(`Blog post ${slug} not found`);
        return {
            notFound: true,
        };
    }

    const similarPosts = await db.article.findMany({
        where: {
            NOT: {
                slug,
            },
            tags: {
                some: {
                    slug: {
                        in: blogPost.tags.map((tag) => tag.slug),
                    },
                },
            },
        },
        include: { tags: true },
        take: 3,
    });

    return {
        post: blogPost,
        similarPosts: similarPosts
    };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await db.article.findUnique({
        where: { slug: params.slug },
    });
    if (!post) {
        return getMetadata({
            title: "Blog post not found",
            info: "404",
            description:
                "This blog post could not be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${post.title}`,
        info: post.likes > 0 ? `${post.likes} Like${post.likes == 1 ? "" : "s"}` : "",
        description: `${post.createdAt.toLocaleDateString()} - ${post.description}`,
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
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full pt-[26rem] p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            {post.image && <ArticleImageBg imageUrl={post.image} />}
            <header
                className={
                    "bg-light-background/30 dark:bg-dark-background/30 gap-3 rounded-lg backdrop-blur-lg z-[1] flex flex-col justify-start items-start md:items-center p-0 md:p-4"
                }
            >
                <h1 className="text-5xl bg-transparent dark:bg-transparent edo">
                    {post.title}
                </h1>
                <DateAndLikes
                    article={post}
                    className={`mt-2 bg-transparent dark:bg-transparent ${post.image ? "text-light dark:text-dark" : "text-muted dark:text-muted-dark"}`}
                    containerClass="bg-transparent dark:bg-transparent"
                />
                <p className="bg-transparent dark:bg-transparent mt-2 mb-1 font-semibold">
                    {post.description}
                </p>
            </header>
            <div
                className={`z-[1] w-full justify-center items-center relative mt-2 mb-8 p-0 md:p-8 rounded-lg`}
            >
                <div
                    className={`z-[1] max-w-3xl self-center relative w-full p-0 md:p-8 text-muted dark:text-muted-dark rounded-lg`}
                >
                    <p className="text-muted dark:text-muted-dark">
                        {post.tags.map((tag) => tag.name).join(", ")}
                    </p>
                    <ArticleBody body={post.body} />
                </div>
            </div>
            {post && (
                <div className="z-[1] flex flex-row justify-start items-center gap-2">
                    <p className="text-muted dark:text-muted-dark">Liked this article?</p>
                    <LikeButton slug={post.slug} />
                    <ShareButton />
                    <TweetArticleButton />
                </div>
            )}
            <LinkButton
                direction="left"
                aria-label="Back to Blog"
                className="mt-8"
                href="/blog"
            >
                Back to blog
            </LinkButton>

            <h2 className="text-3xl mt-12">More articles</h2>

            <div className="md:pl-8">
                <ul>
                    {similarPosts.map((post) => (
                        <li key={post.id}>
                            <BlogListItem post={post} tags={post.tags} inGrid={false} />
                        </li>
                    ))}
                </ul>
            </div>
            {post.tags.length > 0 && (
                <LinkButton
                    className="mt-6 mb-16"
                    href={`/blog/tag/${post.tags[0].slug}`}
                >
                    View all
                </LinkButton>
            )}
        </div>
    );
}
