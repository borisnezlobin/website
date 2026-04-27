"use client";

import type { ClusterCenter, ReservedBox } from "@/app/lib/cluster-layout";

const CHAR_WIDTH_RATIO = 0.52;
const LINE_HEIGHT_RATIO = 1.05;
const PADDING = 18;

/**
 * Pick a font size that lets the label fit horizontally inside the cluster's
 * blob center, without exceeding 70% of the cluster diameter or a hard cap.
 */
export function clusterLabelLayout(label: string, cluster: ClusterCenter): {
  fontSize: number;
  width: number;
  height: number;
  reserved: ReservedBox;
} {
  const maxFont = Math.min(48, cluster.r * 0.22);
  const minFont = 14;
  const maxLabelWidth = cluster.r * 1.4;
  const charsForWidth = Math.max(1, label.length);
  const fittedFont = maxLabelWidth / (charsForWidth * CHAR_WIDTH_RATIO);
  const fontSize = Math.max(minFont, Math.min(maxFont, fittedFont));
  const width = label.length * fontSize * CHAR_WIDTH_RATIO;
  const height = fontSize * LINE_HEIGHT_RATIO;
  return {
    fontSize,
    width,
    height,
    reserved: { width: width + PADDING * 2, height: height + PADDING * 2 },
  };
}

export default function DesktopClusterLabel({
  label,
  cluster,
  fontSize,
}: {
  label: string;
  cluster: ClusterCenter;
  fontSize: number;
}) {
  return (
    <div
      className="select-none pointer-events-none !text-primary dark:!text-primary-dark"
      style={{
        position: "absolute",
        left: cluster.cx,
        top: cluster.cy,
        transform: "translate(-50%, -50%)",
        fontSize,
        lineHeight: LINE_HEIGHT_RATIO,
        whiteSpace: "nowrap",
        fontFamily: "Vectra"
      }}
    >
      {label}
    </div>
  );
}
