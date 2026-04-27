"use client";

import { useEffect } from "react";
import type { Photo } from "@/app/lib/photo-types";
import LightboxControls from "./lightbox-controls";
import LightboxInfo from "./lightbox-info";

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
    const neighbors = [
      photos[(index + 1) % photos.length],
      photos[(index - 1 + photos.length) % photos.length],
    ];
    for (const n of neighbors) {
      if (!n) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = n.image;
    }
  }, [index, photo, photos]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <LightboxControls onClose={onClose} onNext={onNext} onPrev={onPrev} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col-reverse md:flex-row items-center md:items-stretch gap-6 md:gap-10 w-full max-w-6xl"
      >
        <LightboxInfo photo={photo} />

        <div className="flex-1 flex items-center justify-center min-h-0">
          <img
            src={photo.image}
            alt={photo.title}
            crossOrigin="anonymous"
            className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain rounded shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
