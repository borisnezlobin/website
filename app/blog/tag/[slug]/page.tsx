import db from "@/app/lib/db";
import NotFoundPage from "@/app/components/not-found-page";
import { LinkButton } from "@/components/buttons";
import getMetadata from "@/app/lib/metadata";
import CONFIG from "@/app/lib/config";
import BlogListItem from "../../components/blog-list-item";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const tag = await db.tag.findUnique({
    where: { slug: params.slug },
    include: { articles: true },
  });

  if (tag == null) {
    return getMetadata({
      title: "Unkown tag / Blog",
      description:
        "This tag could not be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
    });
  }

  const plural = tag.articles.length == 1 ? "" : "s";

  return getMetadata({
    img: `${CONFIG.API_URL}/og/tag?title=${tag.name}&img=${tag.image}`,
    title: `${tag.articles.length} ${tag.name} Article${plural}`,
    info: "Blog",
    description: `Explore all articles tagged with ${tag.name}`,
  });
}

export async function generateStaticParams() {
  const tags = await db.tag.findMany({
    select: { slug: true },
  });

  return tags.map((tag) => ({ params: { slug: tag.slug } }));
}

const TagPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  const tag = await db.tag.findUnique({
    where: { slug: slug },
    include: { articles: { include: { tags: true } } },
  });

  if (tag == null) {
    return <NotFoundPage title="Tag not found" />;
  }

  console.log(`${CONFIG.API_URL}/og/tag?title=${tag.name}&img=${tag.image}`);

  return (
    <div className="min-h-[100svh] w-full p-8 text-light-foreground dark:text-dark-foreground">
      <div className="flex flex-col md:flex-row justify-between items-center mx-auto max-w-7xl gap-3 md:gap-0">
        <h1 className="text-3xl edo">{tag.name}</h1>
        <p className="text-muted dark:text-muted-dark text-lg mb-4 md:m-0">
          {tag.articles.length} article{tag.articles.length == 1 ? "" : "s"}
        </p>
      </div>
      <img
        src={tag.image}
        alt={tag.name}
        className="mx-auto h-16 object-contain rounded-lg m-0"
      />
      <div className="mt-4 w-full">
        <div className="mx-auto flex flex-row justify-center flex-wrap gap-2 max-w-6xl">
          {tag.articles.map((article) => (
            <BlogListItem inGrid={true} post={article} key={article.id} />
          ))}
        </div>
      </div>
      <LinkButton
        href="/blog/"
        className="mt-8"
        direction="left"
        aria-label="Back to Blog"
      >
        Back to blog
      </LinkButton>
    </div>
  );
};

export default TagPage;
