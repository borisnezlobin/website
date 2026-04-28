"use client";

import { ArrowUpIcon } from "@phosphor-icons/react/dist/ssr";
import type { View } from "./use-pan-zoom";

const EDGE_PAD = 64;
const VIEWPORT_INSET = 80;

/**
 * Edge-pointer marker for a single canvas point (a series shelf, etc.).
 * Independent of the cluster-marker iteration in DesktopEdgeMarkers because
 * there's only one of these and it has different click semantics.
 */
export default function DesktopExtraMarker({
  label,
  cx,
  cy,
  view,
  viewport,
  onClick,
}: {
  label: string;
  cx: number;
  cy: number;
  view: View;
  viewport: { width: number; height: number };
  onClick: () => void;
}) {
  const vw = viewport.width;
  const vh = viewport.height;
  if (vw <= 0 || vh <= 0) return null;

  const targetX = vw / 2 + view.x + cx * view.scale;
  const targetY = vh / 2 + view.y + cy * view.scale;
  const insetW = vw / 2 - VIEWPORT_INSET;
  const insetH = vh / 2 - VIEWPORT_INSET;
  if (Math.abs(targetX - vw / 2) < insetW && Math.abs(targetY - vh / 2) < insetH) return null;

  const dx = targetX - vw / 2;
  const dy = targetY - vh / 2;
  if (dx === 0 && dy === 0) return null;
  const halfW = vw / 2 - EDGE_PAD;
  const halfH = vh / 2 - EDGE_PAD;
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
  const t = Math.min(tx, ty);
  const x = vw / 2 + dx * t;
  const y = vh / 2 + dy * t;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

  return (
    <button
      onClick={onClick}
      style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}
      className="z-20 pointer-events-auto"
      aria-label={`Pan to ${label}`}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(233,100,87,0.92)] text-white shadow-md hover:bg-[rgb(233,100,87)] transition-colors">
        <ArrowUpIcon size={11} weight="bold" style={{ transform: `rotate(${angleDeg}deg)` }} />
        <span className="text-xs font-semibold whitespace-nowrap">
          {label}
        </span>
      </div>
    </button>
  );
}
