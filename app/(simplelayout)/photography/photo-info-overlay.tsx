"use client";

import { useState, useRef, useEffect } from "react";
import { HeartIcon } from "@phosphor-icons/react";
import { likePhoto } from "./like-photo";
import type { PhotoData } from "./gallery";
import { Separator } from "@/app/components/separator";

type Props = {
  photo: PhotoData | null;
  likeCount: number;
  onLikeUpdate: (photoId: string, newCount: number) => void;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = day >= 11 && day <= 13 ? "th" : suffixes[day % 10] || "th";
  return `${month} ${day}${suffix}, ${year}`;
}

export default function PhotoInfoOverlay({ photo, likeCount, onLikeUpdate }: Props) {
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(false);
  const prevPhotoId = useRef<string | null>(null);

  useEffect(() => {
    if (photo && photo.id !== prevPhotoId.current) {
      setVisible(false);
      const timer = setTimeout(() => setVisible(true), 50);
      prevPhotoId.current = photo.id;
      return () => clearTimeout(timer);
    } else if (!photo) {
      setVisible(false);
      prevPhotoId.current = null;
    }
  }, [photo]);

  async function handleLike() {
    if (!photo || likedPhotos.has(photo.id)) return;
    setLikedPhotos((prev) => new Set(prev).add(photo.id));
    onLikeUpdate(photo.id, likeCount + 1);
    await likePhoto(photo.id);
  }

  const isLiked = photo ? likedPhotos.has(photo.id) : false;

  return (
    <div
      className={`fixed bottom-8 left-4 right-4 w-full z-10 flex flex-row items-center justify-center
        transition-all duration-500 pointer-events-none
        ${photo && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {photo && (
        <button
          onClick={handleLike}
          className={`pointer-events-auto flex items-center gap-1.5 px-6 py-1.5 rounded-full text-lg transition-all shadow-xl backdrop-blur-md
            ${isLiked
              ? "bg-red-500/20 text-red-800! dark:text-red-400!"
              : "bg-dark-background/10 dark:bg-light-background/10 hover:bg-dark-background/20 dark:hover:bg-light-background/20 hover:text-white"
            }`}
        >
          <div className="flex justify-center items-center gap-1.5">
            <span>{likeCount}</span>
            <HeartIcon size={16} weight={isLiked ? "fill" : "regular"} />
          </div>
          <Separator className="h-4" />
          <span className="!text-sm">
            Like this photo
          </span>
        </button>
      )}
    </div>
  );
}
