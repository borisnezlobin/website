"use client";

import { useMemo } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import {
  blobOutlinePath,
  placePhotosInCluster,
  type ClusterCenter,
  type PhotoPlacement,
} from "@/app/lib/cluster-layout";
import DesktopPhotoTile from "./desktop-photo-tile";

type Props = {
  category: Category;
  cluster: ClusterCenter;
  photos: Photo[];
  onOpenPhoto: (photoId: string) => void;
  draggedRef: React.MutableRefObject<boolean>;
};

const OUTLINE_PADDING = 32;

export default function DesktopCluster({ category, cluster, photos, onOpenPhoto, draggedRef }: Props) {
  const placements = useMemo<PhotoPlacement[]>(() => {
    return placePhotosInCluster(
      photos.map((p) => ({ slug: p.slug, orientation: p.orientation })),
      cluster,
    );
  }, [photos, cluster]);

  const outlinePath = useMemo(() => blobOutlinePath(cluster), [cluster]);
  const labelY = cluster.cy - cluster.r - 24;

  return (
    <>
      <svg
        style={{
          position: "absolute",
          left: cluster.cx - cluster.r - OUTLINE_PADDING,
          top: cluster.cy - cluster.r - OUTLINE_PADDING,
          width: (cluster.r + OUTLINE_PADDING) * 2,
          height: (cluster.r + OUTLINE_PADDING) * 2,
          pointerEvents: "none",
        }}
        viewBox={`${cluster.cx - cluster.r - OUTLINE_PADDING} ${cluster.cy - cluster.r - OUTLINE_PADDING} ${(cluster.r + OUTLINE_PADDING) * 2} ${(cluster.r + OUTLINE_PADDING) * 2}`}
      >
        <path
          d={outlinePath}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(233,100,87,0.4)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="vectra select-none"
        style={{
          position: "absolute",
          left: cluster.cx,
          top: labelY,
          transform: "translate(-50%, -100%)",
          color: "rgba(233,100,87,0.85)",
          fontSize: Math.max(48, cluster.r * 0.22),
          lineHeight: 1,
          letterSpacing: "0.01em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {category.label}
      </div>
      {photos.map((photo, i) => (
        <DesktopPhotoTile
          key={photo.id}
          photo={photo}
          placement={placements[i]}
          draggedRef={draggedRef}
          onOpen={() => onOpenPhoto(photo.id)}
        />
      ))}
    </>
  );
}
