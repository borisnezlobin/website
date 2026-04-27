"use client";

import { useMemo } from "react";
import { BLOB_MAX_RADIUS_RATIO, blobOutlinePath, type ClusterCenter } from "@/app/lib/cluster-layout";

const STROKE_BUFFER = 6;

export default function DesktopClusterOutline({ cluster }: { cluster: ClusterCenter }) {
  const path = useMemo(() => blobOutlinePath(cluster), [cluster]);
  const outerR = cluster.r * BLOB_MAX_RADIUS_RATIO + STROKE_BUFFER;
  const size = outerR * 2;
  const left = cluster.cx - outerR;
  const top = cluster.cy - outerR;

  return (
    <svg
      style={{ position: "absolute", left, top, width: size, height: size, pointerEvents: "none" }}
      viewBox={`${left} ${top} ${size} ${size}`}
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
