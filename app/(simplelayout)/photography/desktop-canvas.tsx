"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo, Category } from "@/app/lib/photo-types";
import { placeClusterCenters, type ClusterCenter } from "@/app/lib/cluster-layout";
import DesktopCluster from "./desktop-cluster";
import DesktopEdgeMarkers from "./desktop-edge-markers";
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
    scale: 0.8,
  });

  const clusters = useMemo<Map<string, ClusterCenter>>(() => {
    const usable = categories.filter((c) => c.count > 0);
    return placeClusterCenters(
      usable.map((c) => ({ slug: c.slug, count: c.count })),
    );
  }, [categories]);

  const photosByCategory = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const c of categories) map.set(c.slug, []);
    const uncategorized: Photo[] = [];
    for (const p of photos) {
      if (p.categorySlugs.length === 0) {
        uncategorized.push(p);
        continue;
      }
      for (const s of p.categorySlugs) {
        if (map.has(s)) map.get(s)!.push(p);
      }
    }
    return { map, uncategorized };
  }, [photos, categories]);

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
      className="fixed inset-0 overflow-hidden bg-[#0d0b09] text-white touch-none"
      style={{ cursor: draggedRef.current ? "grabbing" : "grab" }}
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
        {categories.map((category) => {
          const cluster = clusters.get(category.slug);
          const list = photosByCategory.map.get(category.slug) ?? [];
          if (!cluster || list.length === 0) return null;
          return (
            <DesktopCluster
              key={category.id}
              category={category}
              cluster={cluster}
              photos={list}
              onOpenPhoto={onOpenPhoto}
              draggedRef={draggedRef}
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

      <div className="absolute top-4 right-4 z-10 max-w-[220px] text-right pointer-events-none">
        <p className="text-[11px] uppercase tracking-widest text-white/50">
          Arrows point to off-screen categories — click to fly there.
        </p>
      </div>
      <div className="absolute bottom-4 left-4 z-10 text-xs uppercase tracking-widest text-white/40 pointer-events-none">
        zoom · {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
