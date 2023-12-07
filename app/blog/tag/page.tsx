import db from "@/app/lib/db";
import { Metadata } from "next";
import BlogListItem from "../blog-list-items";
import ArticleSquareCard from "./article-square-card";
import Link from "next/link";
import { IconButton, LinkButton } from "@/components/buttons";
import { Separator } from "@/components/separator";

export const metadata: Metadata = {
    title: "Explore / Boris Nezlobin",
    description: "Explore all tags and articles on my blog",
}

const ExploreTagsPage = async () => {
    const tags = await db.tag.findMany({
        include: {
            articles: {
                include: {
                    tags: true,
                }
            },
        },
        take: 5,
    });
    
    return (
        <div className="min-h-screen w-screen p-8 text-light-foreground dark:text-dark-foreground">
            <h1 className="text-5xl">Blog / Tags</h1>
            
            {tags.map((tag) => (
                <div key={tag.id} className="mt-8">
                    <h2 className="text-3xl">
                        {tag.name}
                    </h2>
                    <p className="text-muted dark:text-muted-dark">
                        {tag.articles.length} articles •{" "}
                        <Link href={"/blog/tag/" + tag.slug} className="link">
                            View all
                        </Link>
                    </p>
                    <div className="flex items-center overflow-x-auto gap-2">
                        {tag.articles.map((article) => (
                            <>
                                <ArticleSquareCard article={article} key={article.id} />
                                <Separator size="xlarge" />
                            </>
                        ))}
                        <IconButton
                            className="mx-4 w-48"
                            icon={(
                                <p className="bg-transparent">More</p>
                            )}
                        />
                    </div>
                </div>
            ))}

            <LinkButton href="/blog" direction="left" className="mt-8">
                Back to blog
            </LinkButton>
        </div>
    );
}

export default ExploreTagsPage;