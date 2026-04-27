"use client";

import { useMemo } from "react";
import { BLOB_MAX_RADIUS_RATIO, blobOutlinePath, type ClusterCenter } from "@/app/lib/cluster-layout";

const STROKE_BUFFER = 6;

export default function DesktopClusterOutline({ cluster }: { cluster: ClusterCenter }) {
  const path = useMemo(() => blobOutlinePath(cluster), [cluster]);
  const baseR = cluster.r * BLOB_MAX_RADIUS_RATIO + STROKE_BUFFER;
  const xExtent = baseR * cluster.xStretch;
  const yExtent = baseR * cluster.yStretch;
  const left = cluster.cx - xExtent;
  const top = cluster.cy - yExtent;
  const width = xExtent * 2;
  const height = yExtent * 2;

  return (
    <svg
      style={{ position: "absolute", left, top, width, height, pointerEvents: "none" }}
      viewBox={`${left} ${top} ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      <path
        d={path}
        stroke="rgba(233,100,87,0.6)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
