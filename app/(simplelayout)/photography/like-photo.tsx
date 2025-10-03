"use server";

import db from "@/app/lib/db";

export async function likePhoto(photoId: string) {
    console.log("Liking photo", photoId);
    await db.photograph.update({
        where: { id: photoId },
        data: {
            likes: {
                increment: 1,
            },
        },
    });
}