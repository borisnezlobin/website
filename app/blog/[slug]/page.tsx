import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import { LinkButton } from "@/components/buttons";
import BlogListItem from "../components/blog-list-items";
import { ArticleImageBg, ArticleWithAsync, LikeButton, ShareButton, TweetArticleButton } from "./components";
import { DateAndLikes } from "../components/date-and-likes";
import getMetadata from "@/app/lib/metadata";
import ArticleBody from "@/app/components/article-body";


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
    const post = db.article.findUnique({
        where: { slug: params.slug },
        include: { tags: true },
    });


    if(!post){
        return <NotFoundPage title="Blog post not found" />
    }

    const similarPosts = db.article.findMany({
        where: {
            NOT: {
                slug: params.slug,
            },
        },
        include: { tags: true },
        take: 3,
    });


    return (
        <ArticleWithAsync postPromise={post} similarPostsPromise={similarPosts} />
    );
}