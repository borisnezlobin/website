"use server"

import db from "@/app/lib/db";
import { unstable_cache } from "next/cache";

const searchBlogs = unstable_cache(async (query: string) => {
    return await db.article.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { body: { contains: query } },
            ]
        },
    });
});

async function searchPosts(query: string){
    const posts = await searchBlogs(query);

    console.log("Found", posts.length, "posts for query", query);
    return posts;
}

export { searchPosts };