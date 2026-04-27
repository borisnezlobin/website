"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "@/app/lib/photo-types";

const TARGET_ROW_HEIGHT = 150;
const GAP = 4;

type RowItem = { photo: Photo; width: number; height: number };
type Row = RowItem[];

export default function MobileGalleryGrid({
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
    <div ref={containerRef} className="px-2 pb-12 flex flex-col" style={{ gap: GAP }}>
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
  const rows: Row[] = [];
  let queue: { photo: Photo; aspect: number }[] = [];
  let queueWidth = 0;

  for (const photo of photos) {
    const aspect = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
    queue.push({ photo, aspect });
    queueWidth += aspect * TARGET_ROW_HEIGHT + GAP;

    if (queueWidth - GAP >= containerWidth) {
      rows.push(layoutRow(queue, containerWidth));
      queue = [];
      queueWidth = 0;
    }
  }

  if (queue.length > 0) rows.push(layoutRow(queue, containerWidth, true));
  return rows;
}

function layoutRow(
  items: { photo: Photo; aspect: number }[],
  containerWidth: number,
  lastRow = false,
): Row {
  const totalGap = (items.length - 1) * GAP;
  const totalAspect = items.reduce((s, x) => s + x.aspect, 0);
  let height: number;
  if (lastRow) {
    const naturalWidth = totalAspect * TARGET_ROW_HEIGHT + totalGap;
    height = naturalWidth > containerWidth
      ? (containerWidth - totalGap) / totalAspect
      : TARGET_ROW_HEIGHT;
  } else {
    height = (containerWidth - totalGap) / totalAspect;
  }
  return items.map(({ photo, aspect }) => ({
    photo,
    width: aspect * height,
    height,
  }));
}
