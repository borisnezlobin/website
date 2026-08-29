"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "@/app/lib/photo-types";

const GAP = 4;
// Rows get taller as the container widens, so a wide screen shows a comparable
// number of photos per row instead of a long ribbon of tiny thumbnails. Measured
// against the grid's own width, not the viewport — the mosaic takes a column too.
const rowHeightFor = (containerWidth: number) =>
  containerWidth >= 1000 ? 340 : containerWidth >= 640 ? 280 : 190;

type RowItem = { photo: Photo; width: number; height: number };
type Row = RowItem[];

export default function GalleryGrid({
  photos,
  onOpenPhoto,
}: {
  photos: Photo[];
  onOpenPhoto: (photoId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.getBoundingClientRect().width ?? 0;
      setWidth(w);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const rows = useMemo(() => (width <= 0 ? [] : computeRows(photos, width)), [photos, width]);

  return (
    <div ref={containerRef} className="px-2 md:px-6 pb-12 flex flex-col" style={{ gap: GAP }}>
      {rows.map((row, i) => (
        <div key={i} className="flex" style={{ gap: GAP }}>
          {row.map(({ photo, width: w, height: h }) => (
            <button
              key={photo.id}
              onClick={() => onOpenPhoto(photo.id)}
              style={{ width: w, height: h }}
              className="relative overflow-hidden bg-black/10 dark:bg-white/5 rounded-sm"
              aria-label={photo.title}
            >
              <img
                src={photo.thumbUrl}
                alt={photo.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function computeRows(photos: Photo[], containerWidth: number): Row[] {
  if (photos.length === 0) return [];
  const targetRowHeight = rowHeightFor(containerWidth);
  const rows: Row[] = [];
  let queue: { photo: Photo; aspect: number }[] = [];
  let queueWidth = 0;

  for (const photo of photos) {
    const aspect = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
    queue.push({ photo, aspect });
    queueWidth += aspect * targetRowHeight + GAP;

    if (queueWidth - GAP >= containerWidth) {
      rows.push(layoutRow(queue, containerWidth, targetRowHeight));
      queue = [];
      queueWidth = 0;
    }
  }

  if (queue.length > 0) rows.push(layoutRow(queue, containerWidth, targetRowHeight, true));
  return rows;
}

function layoutRow(
  items: { photo: Photo; aspect: number }[],
  containerWidth: number,
  targetRowHeight: number,
  lastRow = false,
): Row {
  const totalGap = (items.length - 1) * GAP;
  const totalAspect = items.reduce((s, x) => s + x.aspect, 0);
  let height: number;
  if (lastRow) {
    const naturalWidth = totalAspect * targetRowHeight + totalGap;
    height = naturalWidth > containerWidth
      ? (containerWidth - totalGap) / totalAspect
      : targetRowHeight;
  } else {
    height = (containerWidth - totalGap) / totalAspect;
  }
  return items.map(({ photo, aspect }) => ({
    photo,
    width: aspect * height,
    height,
  }));
}
