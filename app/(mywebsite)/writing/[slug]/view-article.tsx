"use server";

import db from "@/app/lib/db";
import { cookies, headers } from "next/headers";
import { isbot } from "isbot";
import { VIEW_EXCLUDE_COOKIE } from "@/app/lib/view-config";

export async function viewArticle(slug: string) {
    const userAgent = (await headers()).get("user-agent") ?? "";
    if (!userAgent || isbot(userAgent)) return;

    const excluded = (await cookies()).get(VIEW_EXCLUDE_COOKIE)?.value === "1";
    if (excluded) return;

    await db.article.update({
        where: { slug },
        data: {
            views: { increment: 1 },
            viewEvents: { create: {} },
        },
    });
}
