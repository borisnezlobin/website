"use client";

import { memo } from "react";
import type { Photo } from "@/app/lib/photo-types";
import type { PhotoPlacement } from "@/app/lib/cluster-layout";

type Props = {
  photo: Photo;
  placement: PhotoPlacement;
  onOpen: () => void;
  draggedRef: React.RefObject<boolean>;
};

function DesktopPhotoTile({ photo, placement, onOpen, draggedRef }: Props) {
  return (
    <button
      onClick={() => {
        if (draggedRef.current) return;
        onOpen();
      }}
      style={{
        left: placement.x - placement.width / 2,
        top: placement.y - placement.height / 2,
        width: placement.width,
        height: placement.height,
        transform: `rotate(${placement.rotation}deg)`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        background: "#1A1714",
      }}
      className="rounded-sm absolute border-2 border-muted dark:border-muted-dark hover:z-10 transition-transform"
      aria-label={photo.title}
    >
      <img
        src={photo.thumbUrl}
        alt={photo.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="w-full h-full object-cover select-none"
      />
    </button>
  );
}

export default memo(DesktopPhotoTile);
