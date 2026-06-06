"use server";

import db from "@/app/lib/db";
import { headers } from "next/headers";
import { isbot } from "isbot";

export async function viewArticle(slug: string) {
    const userAgent = (await headers()).get("user-agent") ?? "";
    if (isbot(userAgent)) return;

    await db.article.update({
        where: { slug },
        data: {
            views: {
                increment: 1,
            },
        },
    });
}
