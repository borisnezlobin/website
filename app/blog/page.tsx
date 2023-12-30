import db from "../lib/db";
import { faker } from "@faker-js/faker";
import { revalidatePath } from "next/cache";
import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../lib/metadata";
import { seedTags } from "./components/idontlikevercelbuilds";

export const metadata: Metadata = getMetadata({
    title: "Blog",
    info: "@Rand0mLetterz on Twitter",
    description: "Read my blog posts about software engineering, web development, and more!",
});


const BlogPage = async () => {
    const posts = await db.article.findMany({
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
        <BlogList articles={posts} title="Blog" />
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
            image: "https://tech.sparkfabrik.com/images/content/nextjs/nextjs-logo.jpg",
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
            image: "https://images.unsplash.com/photo-1703027350678-becbec820b2a?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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

export default BlogPage;