"use client";

import { useRouter } from "next/navigation";
import type { SeriesSummary } from "@/app/lib/photo-types";

const SHELF_X = 1400;
const CARD_GAP = 380;
const COVER_LONG_EDGE = 280;
const COVER_MIN_SHORT_EDGE = 170;

type Props = {
  series: SeriesSummary[];
  draggedRef: React.RefObject<boolean>;
};

/**
 * A vertical column of "series cards" placed at a fixed X to the right of
 * the cluster ring in canvas-space. Each card stacks the cover photo over
 * a sliver of the next photo (tilted slightly), at native aspect ratio so
 * panoramas don't get square-cropped.
 */
export default function DesktopSeriesShelf({ series, draggedRef }: Props) {
  if (series.length === 0) return null;
  const yStart = -((series.length - 1) * CARD_GAP) / 2;
  return (
    <>
      {series.map((s, i) => (
        <SeriesCard
          key={s.id}
          series={s}
          x={SHELF_X}
          y={yStart + i * CARD_GAP}
          draggedRef={draggedRef}
        />
      ))}
    </>
  );
}

export function seriesShelfCenter(): { cx: number; cy: number } {
  // Center of the column — used by the edge marker to know where to point.
  return { cx: SHELF_X, cy: 0 };
}

function SeriesCard({
  series, x, y, draggedRef,
}: {
  series: SeriesSummary;
  x: number;
  y: number;
  draggedRef: React.RefObject<boolean>;
}) {
  const router = useRouter();
  const cover = series.coverPhotos[0];
  const behind = series.coverPhotos[1];
  if (!cover) return null;

  const ratio = cover.width > 0 && cover.height > 0 ? cover.width / cover.height : 1;
  let w = ratio >= 1 ? COVER_LONG_EDGE : COVER_LONG_EDGE * ratio;
  let h = ratio >= 1 ? COVER_LONG_EDGE / ratio : COVER_LONG_EDGE;
  // Bump panoramas / very tall photos so the card never feels anemic.
  const shortest = Math.min(w, h);
  if (shortest < COVER_MIN_SHORT_EDGE) {
    const scale = COVER_MIN_SHORT_EDGE / shortest;
    w *= scale;
    h *= scale;
  }
  const padding = 16;

  return (
    <button
      onClick={() => {
        if (draggedRef.current) return;
        router.push(`/photography/series/${series.slug}`);
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
      className="group text-center"
      aria-label={`Open series: ${series.title}`}
    >
      <div
        className="relative mx-auto"
        style={{ width: w + padding * 2, height: h + padding * 2 }}
      >
        {behind && (
          <img
            src={behind.thumbUrl}
            alt=""
            crossOrigin="anonymous"
            draggable={false}
            style={{
              position: "absolute",
              left: padding + 14,
              top: padding + 14,
              width: w * 0.92,
              height: h * 0.92,
              transform: "rotate(5deg)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
              border: "4px solid #1A1714",
              background: "#1A1714",
              objectFit: "cover",
            }}
          />
        )}
        <img
          src={cover.thumbUrl}
          alt={series.title}
          crossOrigin="anonymous"
          draggable={false}
          style={{
            position: "absolute",
            left: padding,
            top: padding,
            width: w,
            height: h,
            boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
            border: "4px solid #1A1714",
            background: "#1A1714",
            objectFit: "cover",
            transition: "transform 200ms",
          }}
          className="group-hover:scale-[1.02]"
        />
      </div>
      <div
        className="vectra text-4xl !text-primary dark:!text-primary-dark mt-3 leading-tight"
        style={{ paddingTop: 6 }}
      >
        {series.title}
      </div>
      <span className="block text-sm text-muted dark:text-muted-dark mt-1">
        {series.count} photo{series.count === 1 ? "" : "s"}
      </span>
    </button>
  );
}
