"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@/app/lib/photo-types";
import type { ClusterCenter } from "@/app/lib/cluster-layout";
import type { View } from "./use-pan-zoom";

const EDGE_PAD = 56;
const VIEWPORT_INSET = 80;

type MarkerInfo = {
  category: Category;
  cluster: ClusterCenter;
  x: number;
  y: number;
  angle: number;
};

export default function DesktopEdgeMarkers({
  categories,
  clusters,
  view,
  viewport,
  onJumpTo,
}: {
  categories: Category[];
  clusters: Map<string, ClusterCenter>;
  view: View;
  viewport: { width: number; height: number };
  onJumpTo: (cluster: ClusterCenter) => void;
}) {
  const markers = computeMarkers(categories, clusters, view, viewport);

  return (
    <>
      {markers.map((m) => (
        <button
          key={m.category.id}
          onClick={() => onJumpTo(m.cluster)}
          style={{
            position: "absolute",
            left: m.x,
            top: m.y,
            transform: `translate(-50%, -50%) rotate(${m.angle}rad)`,
          }}
          className="z-20 pointer-events-auto"
          aria-label={`Pan to ${m.category.label}`}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 border border-white/15 text-white shadow-lg transition-colors"
          >
            <ArrowRightIcon size={16} weight="bold" />
            <span
              className="text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap"
              style={{ transform: `rotate(${-m.angle}rad)`, display: "inline-block" }}
            >
              {m.category.label}
            </span>
          </div>
        </button>
      ))}
    </>
  );
}

function computeMarkers(
  categories: Category[],
  clusters: Map<string, ClusterCenter>,
  view: View,
  viewport: { width: number; height: number },
): MarkerInfo[] {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const insetW = cx - VIEWPORT_INSET;
  const insetH = cy - VIEWPORT_INSET;
  const halfW = cx - EDGE_PAD;
  const halfH = cy - EDGE_PAD;

  const out: MarkerInfo[] = [];
  for (const category of categories) {
    const cluster = clusters.get(category.slug);
    if (!cluster) continue;
    const targetX = cx + view.x + cluster.cx * view.scale;
    const targetY = cy + view.y + cluster.cy * view.scale;
    if (Math.abs(targetX - cx) < insetW && Math.abs(targetY - cy) < insetH) continue;

    const dx = targetX - cx;
    const dy = targetY - cy;
    if (dx === 0 && dy === 0) continue;
    const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
    const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
    const t = Math.min(tx, ty);
    out.push({
      category,
      cluster,
      x: cx + dx * t,
      y: cy + dy * t,
      angle: Math.atan2(dy, dx),
    });
  }
  return out;
}
