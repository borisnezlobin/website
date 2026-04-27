"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import {
  outerExtent,
  placeClusterCenters,
  placePhotosInRing,
  type ClusterCenter,
} from "@/app/lib/cluster-layout";
import DesktopCluster from "./desktop-cluster";
import DesktopEdgeMarkers from "./desktop-edge-markers";
import DesktopPhotoTile from "./desktop-photo-tile";
import DesktopWelcome from "./desktop-welcome";
import { usePanZoom } from "./use-pan-zoom";

type Props = {
  photos: Photo[];
  categories: Category[];
  onOpenPhoto: (photoId: string) => void;
};

export default function DesktopCanvas({ photos, categories, onOpenPhoto }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { view, animateTo, draggedRef, panZoomHandlers } = usePanZoom(containerRef, {
    x: 0,
    y: 0,
    scale: 1.2,
  });

  const { clusters, photosByCategory, uncategorized } = useMemo(() => {
    const usable = categories.filter((c) => c.count > 0);
    const clusters = placeClusterCenters(
      usable.map((c) => ({ slug: c.slug, count: c.count })),
    );
    const map = new Map<string, Photo[]>();
    for (const c of usable) map.set(c.slug, []);
    const uncategorized: Photo[] = [];
    for (const p of photos) {
      if (p.categorySlugs.length === 0) {
        uncategorized.push(p);
        continue;
      }
      let placed = false;
      for (const s of p.categorySlugs) {
        if (map.has(s)) {
          map.get(s)!.push(p);
          placed = true;
          break;
        }
      }
      if (!placed) uncategorized.push(p);
    }
    return { clusters, photosByCategory: map, uncategorized };
  }, [photos, categories]);

  const ringPlacements = useMemo(() => {
    if (uncategorized.length === 0) return [];
    const inner = outerExtent(clusters, 80);
    const width = 220;
    return placePhotosInRing(
      uncategorized.map((p) => ({ slug: p.slug, orientation: p.orientation })),
      inner,
      width,
    );
  }, [uncategorized, clusters]);

  function jumpTo(cluster: ClusterCenter) {
    animateTo({
      x: -cluster.cx * view.scale,
      y: -cluster.cy * view.scale,
      scale: view.scale,
    });
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground touch-none cursor-grab active:cursor-grabbing"
      {...panZoomHandlers}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <DesktopWelcome />

        {categories.map((category) => {
          const cluster = clusters.get(category.slug);
          const list = photosByCategory.get(category.slug) ?? [];
          if (!cluster || list.length === 0) return null;
          return (
            <DesktopCluster
              key={category.id}
              cluster={cluster}
              category={category}
              photos={list}
              onOpenPhoto={onOpenPhoto}
              draggedRef={draggedRef}
            />
          );
        })}

        {uncategorized.map((photo, i) => {
          const placement = ringPlacements[i];
          if (!placement) return null;
          return (
            <DesktopPhotoTile
              key={photo.id}
              photo={photo}
              placement={placement}
              draggedRef={draggedRef}
              onOpen={() => onOpenPhoto(photo.id)}
            />
          );
        })}
      </div>

      <DesktopEdgeMarkers
        categories={categories.filter((c) => c.count > 0)}
        clusters={clusters}
        view={view}
        viewport={viewport}
        onJumpTo={jumpTo}
      />

      <div className="absolute bottom-3 left-4 z-10 text-[10px] uppercase tracking-widest text-muted dark:text-muted-dark pointer-events-none">
        zoom · {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
