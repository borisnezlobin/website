import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import { IconButton, LinkButton } from "@/components/buttons";
import BlogListItem from "../components/blog-list-items";
import { HeartStraight, Share, TwitterLogo } from "@phosphor-icons/react/dist/ssr";
import { likePost } from "./actions";
import { ArticleImageBg, LikeButton, ShareButton, TweetArticleButton } from "./components";
import { DateAndLikes } from "../components/date-and-likes";
import getMetadata from "@/app/lib/metadata";

export async function generateMetadata({ params }: { params: { slug: string }}) {
    const post = await db.article.findUnique({
        where: { slug: params.slug },
    });
    
    if(!post){
        return getMetadata({
            title: "Blog post not found",
            info: "404",
            description: "This blog post could not be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${post.title}`,
        info: (new Date()).toLocaleDateString(),
        subtitle: "Boris Nezlobin",
        description: `${post.createdAt.toLocaleDateString} - ${post.description}`,
    });
}

export default async function SingleBlogPage({ params }: { params: { slug: string } }){
    const post = await db.article.findUnique({
        where: { slug: params.slug },
        include: { tags: true },
    });


    if(!post){
        return <NotFoundPage title="Blog post not found" />
    }

    console.log(post);

    const similarPosts = await db.article.findMany({
        where: {
            NOT: {
                id: post.id
            },
            tags: {
                some: {
                    slug: {
                        in: post.tags.map((tag) => tag.slug)
                    }
                }
            },
        },
        include: { tags: true },
        take: 3,
    });

    const containerClass = "flex flex-col justify-start bg-light-background/30 dark:bg-dark-background/30 items-center gap-3 rounded-lg p-4 backdrop-blur-3xl";

    return (
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full p-8 text-light-foreground dark:text-dark-foreground">
            <div className={containerClass}>
                <h1 className="text-5xl bg-transparent dark:bg-transparent edo">{post.title}</h1>
                <DateAndLikes
                    article={post}
                    className={`mt-2 bg-transparent dark:bg-transparent ${post.image ? "text-light dark:text-dark" : "text-muted dark:text-muted-dark"}`}
                    containerClass="bg-transparent dark:bg-transparent"
                />
                <p className="bg-transparent dark:bg-transparent mt-2 mb-1 font-semibold p-4">{post.description}</p>
                <p className="bg-transparent dark:bg-transparent w-full text-right">
                    Boris Nezlobin
                </p>
            </div>
            <p className="mt-2 w-full mb-8 p-8 rounded-lg">
                {/* TODO: markdown :sparkles: */}
                {post.body + "\n\n"}{post.body + "\n\n"}{post.body}
            </p>
            <div className="flex flex-row justify-start items-center gap-2">
                <p className="text-muted dark:text-muted-dark">
                    Liked this article?
                </p>
                <LikeButton slug={post.slug} />
                <ShareButton />
                <TweetArticleButton />
            </div>

            <LinkButton direction="left" className="mt-8" href="/blog">
                Back to blog
            </LinkButton>

            <div className="mt-12 mb-16">
                <h2 className="text-3xl">Check out more {post.tags[0].name} articles</h2>
                <ul>
                    {similarPosts.map((post) => (
                        <li key={post.id}>
                            <BlogListItem post={post} tags={post.tags} />
                        </li>
                    ))}
                </ul>
            </div>
            {post.image && <ArticleImageBg imageUrl={post.image} />}
        </div>
    );
}