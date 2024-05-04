import db from "@/app/lib/db";
import { Metadata } from "next";
import ArticleSquareCard from "../components/article-square-card";
import Link from "next/link";
import { IconButton, LinkButton } from "@/components/buttons";
import { Separator } from "@/components/separator";
import getMetadata from "@/app/lib/metadata";
import BlogListItem from "../components/blog-list-items";

export const metadata: Metadata = getMetadata({
  title: "Explore All Articles",
  info: "@Rand0mLetterz on Twitter",
  description: "Explore all tags and articles on my blog",
});

const ExploreTagsPage = async () => {
  const tags = await db.tag.findMany({
    include: {
      articles: {
        include: {
          tags: true,
        },
      },
    },
    take: 5,
  });

  return (
    <div className="min-h-screen w-full p-8 text-light-foreground dark:text-dark-foreground">
      <h1 className="text-5xl edo">Tags</h1>

      {tags.map((tag) => (
        <div key={tag.id} className="mt-8">
          <h2 className="text-xl">{tag.name}</h2>
          <p className="text-muted dark:text-muted-dark">
            {tag.articles.length} articles •{" "}
            <Link
              href={"/blog/tag/" + tag.slug}
              className="link"
              aria-label={"View all " + tag.name + " articles"}
            >
              View all
            </Link>
          </p>
          <div className="flex items-center overflow-x-auto gap-2 pt-4">
            {tag.articles.length !== 0 ? (
              <>
                {tag.articles.slice(0, 3).map((article) => (
                  <>
                    <BlogListItem
                      inGrid={true}
                      post={article}
                      key={article.id}
                    />
                    <Separator size="xlarge" key={"sep" + article.id} />
                  </>
                ))}
                <IconButton
                  className="mx-4 w-48"
                  icon={<p className="bg-transparent">More</p>}
                />
              </>
            ) : (
              <p>No articles... yet!</p>
            )}
          </div>
        </div>
      ))}

      <LinkButton
        href="/blog"
        direction="left"
        className="mt-8"
        title="Back to Blog"
      >
        Back to blog
      </LinkButton>
    </div>
  );
};

export default ExploreTagsPage;
