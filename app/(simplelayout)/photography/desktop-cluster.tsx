"use client";

import { useMemo } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import {
  placePhotosInCluster,
  type ClusterCenter,
  type PhotoPlacement,
} from "@/app/lib/cluster-layout";
import DesktopClusterLabel, { clusterLabelLayout } from "./desktop-cluster-label";
import DesktopClusterOutline from "./desktop-cluster-outline";
import DesktopPhotoTile from "./desktop-photo-tile";

type Props = {
  photos: Photo[];
  cluster: ClusterCenter;
  category: Category;
  onOpenPhoto: (photoId: string) => void;
  draggedRef: React.MutableRefObject<boolean>;
};

export default function DesktopCluster({ photos, cluster, category, onOpenPhoto, draggedRef }: Props) {
  const labelLayout = useMemo(() => clusterLabelLayout(category.label, cluster), [category.label, cluster]);

  const placements = useMemo<PhotoPlacement[]>(() => {
    return placePhotosInCluster(
      photos.map((p) => ({ slug: p.slug, orientation: p.orientation })),
      cluster,
      labelLayout.reserved,
    );
  }, [photos, cluster, labelLayout]);

  return (
    <>
      <DesktopClusterOutline cluster={cluster} />
      {photos.map((photo, i) => (
        <DesktopPhotoTile
          key={photo.id}
          photo={photo}
          placement={placements[i]}
          draggedRef={draggedRef}
          onOpen={() => onOpenPhoto(photo.id)}
        />
      ))}
      <DesktopClusterLabel label={category.label} cluster={cluster} fontSize={labelLayout.fontSize} />
    </>
  );
}
