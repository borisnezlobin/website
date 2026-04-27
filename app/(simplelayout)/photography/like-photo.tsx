"use server";

import { revalidateTag } from "next/cache";
import db from "@/app/lib/db";

export async function likePhoto(photoId: string) {
    await db.photograph.update({
        where: { id: photoId },
        data: {
            likes: {
                increment: 1,
            },
        },
    });
    // Bust the photos cache so getPhotographs / getPhotoFeed return the
    // incremented count on the next page render.
    revalidateTag("photos");
}
