import db from "../lib/db";
import { faker } from "@faker-js/faker";
import { revalidatePath } from "next/cache";
import { Metadata } from "next";
import BlogListItem from "./blog-list-items";
import { SearchBar } from "./[slug]/components";
import { Article } from "@prisma/client";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Blog / Boris Nezlobin",
    description: "Read my blog posts about software engineering, web development, and more!",
};

const BlogPage = async ({ articles, title, query }: { articles?: Article[], title?: string, query?: string }) => {
    const posts = articles || await db.article.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            tags: true,
        }
    });

    const tags = await db.tag.findMany();

    if(tags.length == 0){
        await seedTags();
        revalidatePath("/blog");
    }

    if(posts.length == 0){
        await seedArticles();
        revalidatePath("/blog");
    }


    return (
        <div className="min-h-screen w-screen p-8 text-light-foreground dark:text-dark-foreground" suppressHydrationWarning>
            <h1 className="text-3xl">{title ? title : "Blog"}</h1>
            <p className="mt-1">Read my blog posts about software engineering, web development, and more!</p>
            <SearchBar query={query}/>
            <p className="mt-1 text-muted dark:text-muted-dark">
                Showing {posts.length} post{posts.length == 1 ? " " : "s "}
                <span className="text-muted dark:text-muted-dark">
                    {" • "}
                </span>
                <Link href="/blog/tags" className="link">
                    Explore all
                </Link>
            </p>
            {posts.map((post) => (
                // all my homies love
                // @ts-ignore
                <BlogListItem post={post} tags={post.tags ? post.tags : []} key={post.id} />
            ))}
        </div>
    );
};

async function seedArticles() {
    console.log("Deleting all articles...");
    await db.article.deleteMany();
    console.log("Seeding database...");
    await db.article.create({
        data: {
            title: "Learning NextJS and SQL",
            description: faker.lorem.sentence() + " " + faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5) + "\n" + faker.lorem.paragraphs(5),
            slug: "learning-nextjs",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "nextjs" },
                    { slug: "js" },
                    { slug: "sql" }
                ]
            },
        }
    });
    await db.article.create({
        data: {
            title: "My first article",
            description: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5),
            slug: "my-first-article",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "nextjs" },
                    { slug: "js" },
                    { slug: "sql" }
                ]
            },
        }
    });
    await db.article.create({
        data: {
            title: "My second article",
            description: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5),
            slug: "my-second-article",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "nextjs" },
                ]
            },
        }
    });
    await db.article.create({
        data: {
            title: "Figuring out SQL in TS",
            description: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5),
            slug: "sql-in-ts",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "sql" },
                    { slug: "nextjs" },
                ]
            },
        }
    });
    await db.article.create({
        data: {
            title: "Learning TypeScript",
            description: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5),
            slug: "learning-ts",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "ts" },
                    { slug: "js" },
                ]
            },
        }
    });
    await db.article.create({
        data: {
            title: "Sh*t goes WILD sometimes",
            description: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(5),
            slug: "wild-shit",
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: {
                connect: [
                    { slug: "ts" },
                    { slug: "js" },
                ]
            },
        }
    });
    console.log("Done seeding database.");
}

const seedTags = async () => {
    console.log("Deleting all tags...");
    await db.tag.deleteMany();
    console.log("Seeding tags...");
    await db.tag.create({
        data: {
            name: "NextJS",
            slug: "nextjs",
        }
    });
    await db.tag.create({
        data: {
            name: "JavaScript",
            slug: "js",
        }
    });
    await db.tag.create({
        data: {
            name: "SQL",
            slug: "sql",
        }
    });
    await db.tag.create({
        data: {
            name: "TypeScript",
            slug: "ts",
        }
    });
    console.log("Done seeding tags.");
}

export default BlogPage;