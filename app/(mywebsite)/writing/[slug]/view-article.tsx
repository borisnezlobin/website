"use server";

import db from "@/app/lib/db";

export async function viewArticle(slug: string) {
    await db.article.update({
        where: { slug },
        data: {
            views: {
                increment: 1,
            },
        },
    });
}
