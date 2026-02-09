"use client";

import { useState, useTransition } from "react";
import { HeartIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { PrintCard, getPrintTransform } from "@/app/components/landing/print-card";
import type { PrintCardPhoto } from "@/app/components/landing/print-card";
import { likePhoto } from "./like-photo";
import { loadMorePhotos } from "./load-more-photos";

type PhotoWithLikes = PrintCardPhoto & {
    id: string;
    description: string;
    likes: number;
};

export default function MobileGallery({
    initialPhotos,
    totalCount,
    pageSize,
}: {
    initialPhotos: PhotoWithLikes[];
    totalCount: number;
    pageSize: number;
}) {
    const [photos, setPhotos] = useState<PhotoWithLikes[]>(initialPhotos);
    const [likes, setLikes] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        initialPhotos.forEach((p) => (map[p.id] = p.likes));
        return map;
    });
    const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const hasMore = photos.length < totalCount;

    async function handleLike(photoId: string) {
        if (likedPhotos.has(photoId)) return;
        setLikedPhotos((prev) => new Set(prev).add(photoId));
        setLikes((prev) => ({ ...prev, [photoId]: (prev[photoId] ?? 0) + 1 }));
        await likePhoto(photoId);
    }

    function handleLoadMore() {
        startTransition(async () => {
            const morePhotos = await loadMorePhotos(photos.length, pageSize);
            setPhotos((prev) => [...prev, ...morePhotos]);
            setLikes((prev) => {
                const updated = { ...prev };
                morePhotos.forEach((p: PhotoWithLikes) => (updated[p.id] = p.likes));
                return updated;
            });
        });
    }

    return (
        <div className="w-full min-h-screen px-4 pt-20 pb-12">
            <h1 className="vectra text-4xl text-center mb-2">Photography</h1>
            <p className="text-muted dark:text-muted-dark text-center text-sm mb-10">
                Tap a photo to see its title. Long-press to like.
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-8 place-items-center">
                {photos.map((photo, i) => {
                    const { rotation, offset } = getPrintTransform(i);
                    const isLiked = likedPhotos.has(photo.id);
                    return (
                        <div key={photo.id} className="flex flex-col items-center gap-2">
                            <PrintCard
                                photo={photo}
                                rotation={rotation}
                                offset={offset}
                                className="w-40 h-48 sm:w-48 sm:h-56"
                            />
                            <button
                                onClick={() => handleLike(photo.id)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors ${
                                    isLiked
                                        ? "text-primary"
                                        : "text-muted dark:text-muted-dark"
                                }`}
                            >
                                <HeartIcon size={12} weight={isLiked ? "fill" : "regular"} />
                                <span>{likes[photo.id] ?? photo.likes}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleLoadMore}
                        disabled={isPending}
                        className="px-6 py-2.5 text-sm font-medium rounded-full border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-400 transition-colors disabled:opacity-50"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <SpinnerGapIcon size={14} className="animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            "Load more"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
