"use client";

import { useEffect } from "react";
import { CaretLeftIcon, CaretRightIcon, HeartIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { Photo } from "@/app/lib/photo-types";
import { likePhoto } from "./like-photo";

export default function Lightbox({
  photos,
  index,
  onClose,
  onNext,
  onPrev,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    if (!photo) return;
    const neighbors = [photos[(index + 1) % photos.length], photos[(index - 1 + photos.length) % photos.length]];
    for (const n of neighbors) {
      if (!n) continue;
      const img = new Image();
      img.src = n.image;
    }
  }, [index, photo, photos]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors"
        aria-label="Previous photo"
      >
        <CaretLeftIcon size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors"
        aria-label="Next photo"
      >
        <CaretRightIcon size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors"
        aria-label="Close"
      >
        <XIcon size={24} />
      </button>

      <figure
        className="flex flex-col items-center gap-4 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.image}
          alt={photo.title}
          className="max-w-[92vw] max-h-[78vh] object-contain rounded shadow-2xl"
        />
        <figcaption className="text-center text-white/90 max-w-2xl">
          <h2 className="vectra text-2xl mb-1">{photo.title}</h2>
          {photo.description && (
            <p className="text-white/70 text-sm mb-2">{photo.description}</p>
          )}
          <PhotoMeta photo={photo} />
        </figcaption>
      </figure>
    </div>
  );
}

function PhotoMeta({ photo }: { photo: Photo }) {
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-white/50">
      {photo.camera && <span>{photo.camera}</span>}
      {photo.takenAt && (
        <span>
          {new Date(photo.takenAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
      <LikeButton photo={photo} />
    </div>
  );
}

function LikeButton({ photo }: { photo: Photo }) {
  return (
    <button
      onClick={async () => {
        try {
          await likePhoto(photo.id);
        } catch (e) {
          console.error(e);
        }
      }}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      <HeartIcon size={12} />
      <span>{photo.likes}</span>
    </button>
  );
}
