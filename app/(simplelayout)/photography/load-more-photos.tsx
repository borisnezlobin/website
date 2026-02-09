"use server";

import { getPhotographsPaginated } from "@/app/lib/db-caches";

export async function loadMorePhotos(skip: number, take: number) {
    const photos = await getPhotographsPaginated(skip, take);
    return JSON.parse(JSON.stringify(photos));
}
