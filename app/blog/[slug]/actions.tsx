"use server"

import db from "@/app/lib/db";

async function likePost(slug: string){
    console.log("Liking post with slug", slug);
    await db.article.update({
        where: { slug: slug },
        data: {
            likes: {
                increment: 1,
            }
        }
    });
}

async function searchPosts(query: string){
    const posts = await db.article.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { body: { contains: query } },
            ]
        },
    });

    console.log("Found", posts.length, "posts");
    return posts;
}

export { likePost, searchPosts };