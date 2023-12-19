import db from "../lib/db";
import { faker } from "@faker-js/faker";
import { revalidatePath } from "next/cache";
import { Metadata } from "next";
import BlogList from "./components/blog-list";
import getMetadata from "../lib/metadata";

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
            image: "https://tech.sparkfabrik.com/images/content/nextjs/nextjs-logo.jpg"
        }
    });
    await db.tag.create({
        data: {
            name: "JavaScript",
            slug: "js",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/640px-JavaScript-logo.png"
        }
    });
    await db.tag.create({
        data: {
            name: "SQL",
            slug: "sql",
            image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Sql_data_base_with_logo.png"
        }
    });
    await db.tag.create({
        data: {
            name: "TypeScript",
            slug: "ts",
            image: "https://cdn-images-1.medium.com/max/2000/1*mn6bOs7s6Qbao15PMNRyOA.png"
        }
    });
    console.log("Done seeding tags.");
}

export default BlogPage;