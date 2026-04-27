"use client";

import { ArrowUpIcon } from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@/app/lib/photo-types";
import type { ClusterCenter } from "@/app/lib/cluster-layout";
import type { View } from "./use-pan-zoom";

const EDGE_PAD = 64;
const VIEWPORT_INSET = 80;

type MarkerInfo = {
  category: Category;
  cluster: ClusterCenter;
  x: number;
  y: number;
  arrowAngleDeg: number;
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
            transform: "translate(-50%, -50%)",
          }}
          className="z-20 pointer-events-auto"
          aria-label={`Pan to ${m.category.label}`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(233,100,87,0.92)] text-white shadow-md hover:bg-[rgb(233,100,87)] transition-colors">
            <ArrowUpIcon
              size={11}
              weight="bold"
              style={{ transform: `rotate(${m.arrowAngleDeg}deg)` }}
            />
            <span className="whitespace-nowrap">
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
    // ArrowUp icon points up at 0deg; we want it to point along (dx,dy)
    const arrowAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    out.push({
      category,
      cluster,
      x: cx + dx * t,
      y: cy + dy * t,
      arrowAngleDeg,
    });
  }
  return out;
}
