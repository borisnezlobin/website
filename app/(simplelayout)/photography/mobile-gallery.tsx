"use client";

import { useState } from "react";
import { HeartIcon } from "@phosphor-icons/react";
import { PrintCard, getPrintTransform } from "@/app/components/landing/print-card";
import type { PrintCardPhoto } from "@/app/components/landing/print-card";
import { likePhoto } from "./like-photo";

type PhotoWithLikes = PrintCardPhoto & {
    id: string;
    description: string;
    likes: number;
};

export default function MobileGallery({ photos }: { photos: PhotoWithLikes[] }) {
    const [likes, setLikes] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        photos.forEach((p) => (map[p.id] = p.likes));
        return map;
    });
    const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

    async function handleLike(photoId: string) {
        if (likedPhotos.has(photoId)) return;
        setLikedPhotos((prev) => new Set(prev).add(photoId));
        setLikes((prev) => ({ ...prev, [photoId]: (prev[photoId] ?? 0) + 1 }));
        await likePhoto(photoId);
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
        </div>
    );
}
