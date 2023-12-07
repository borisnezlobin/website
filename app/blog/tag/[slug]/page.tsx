import db from "@/app/lib/db";
import NotFoundPage from "@/app/components/not-found-page";
import ArticleSquareCard from "../article-square-card";
import { LinkButton } from "@/components/buttons";

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const tag = await db.tag.findUnique({
        where: { slug: params.slug },
    });

    if(tag == null){
        return {
            title: "Unkown tag / Boris Nezlobin",
            description: "This tag could not be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        }
    }

    return {
        title: `${tag.name} Articles / Boris Nezlobin`,
        description: `Explore all articles tagged with ${tag.name}`,
    }
}

const TagPage = async ({ params }: { params: { slug: string } }) => {
    const slug = params.slug;
    const tag = await db.tag.findUnique({
        where: { slug: slug },
        include: { articles: { include: { tags: true }} },
    });

    if(tag == null){
        return <NotFoundPage title="Tag not found" />
    }

    return <div className="min-h-screen w-screen p-8 text-light-foreground dark:text-dark-foreground">
        <div className="flex flex-col md:flex-row justify-between items-center mx-auto max-w-7xl gap-3 md:gap-0">
            <h1 className="text-5xl">Blog / {tag.name}</h1>
            <p className="text-muted dark:text-muted-dark text-lg">
                {tag.articles.length} article{tag.articles.length == 1 ? "" : "s"}
            </p>
        </div>
        <div className="mt-4 w-full">
            <div className="mx-auto flex flex-row justify-center flex-wrap gap-2 max-w-6xl">
                {tag.articles.map((article) => (
                    <ArticleSquareCard article={article} key={article.id} />
                ))}
            </div>
        </div>
        <LinkButton href="/blog/" className="mt-8" direction="left">
            Back to blog
        </LinkButton>
    </div>
}

export default TagPage;