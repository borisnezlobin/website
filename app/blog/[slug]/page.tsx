import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import { LinkButton } from "@/components/buttons";
import BlogListItem from "../components/blog-list-items";
import { ArticleBody, ArticleImageBg, LikeButton, ShareButton, TweetArticleButton } from "./components";
import { DateAndLikes } from "../components/date-and-likes";
import getMetadata from "@/app/lib/metadata";
import { remark } from 'remark';
import html from 'remark-html';


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

    const containerClass = "bg-light-background/30 dark:bg-dark-background/30 gap-3 rounded-lg backdrop-blur-lg ";

    return (
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full pt-[26rem] p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <header className={containerClass + (post.image ? "flex flex-col justify-start items-start md:items-center p-0 md:p-4" : "")}>
                <h1 className="text-5xl bg-transparent dark:bg-transparent edo">{post.title}</h1>
                <DateAndLikes
                    article={post}
                    className={`mt-2 bg-transparent dark:bg-transparent ${post.image ? "text-light dark:text-dark" : "text-muted dark:text-muted-dark"}`}
                    containerClass="bg-transparent dark:bg-transparent"
                />
                <p className="bg-transparent dark:bg-transparent mt-2 mb-1 font-semibold">{post.description}</p>
                {post.image && 
                    <p className="bg-transparent dark:bg-transparent hidden md:block w-full text-right">
                        Boris Nezlobin
                    </p>
                }
            </header>
            <div className={`mt-2 w-full mb-8 ${post.image ? "p-0 md:p-8" : ""} rounded-lg`}>
                <span className="text-muted dark:text-muted-dark">
                    {post.tags.map((tag) => tag.name).join(", ")}
                </span>
                <br />
                <ArticleBody text={post.body} />
            </div>
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

            <h2 className="text-3xl mt-12">Check out more {post.tags[0].name} articles</h2>

            <div className="md:pl-8">
                <ul>
                    {similarPosts.map((post) => (
                        <li key={post.id}>
                            <BlogListItem post={post} tags={post.tags} />
                        </li>
                    ))}
                </ul>
            </div>
            <LinkButton className="mt-6 mb-16" href={`/blog/tag/${post.tags[0].slug}`}>
                View all
            </LinkButton>
            {post.image && <ArticleImageBg imageUrl={post.image} />}
        </div>
    );
}