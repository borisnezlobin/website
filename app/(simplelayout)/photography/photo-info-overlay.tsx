"use client";

import { useState, useRef, useEffect } from "react";
import { Heart } from "@phosphor-icons/react";
import { likePhoto } from "./like-photo";
import type { PhotoData } from "./gallery";

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
      className={`fixed bottom-8 left-4 right-4 md:right-auto md:left-8 md:bottom-8 md:max-w-sm z-10
        transition-all duration-500 pointer-events-none
        ${photo && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {photo && (
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-5 text-white border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight">{photo.title}</h2>
              {photo.description && (
                <p className="text-white/60 mt-1.5 text-sm leading-relaxed">{photo.description}</p>
              )}
              <p className="text-white/40 mt-2 text-xs">{formatDate(photo.createdAt)}</p>
            </div>
            <button
              onClick={handleLike}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                ${isLiked
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
            >
              <Heart size={16} weight={isLiked ? "fill" : "regular"} />
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
