"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/app/lib/photo-types";

/**
 * Preload every photo's micro thumbnail into a stable Map<photoId, HTMLImageElement>.
 * The canvas renderer reads from this map directly via drawImage. Returns a
 * version counter that bumps each time a new image finishes loading, so the
 * canvas can repaint to reveal newly-ready tiles.
 */
export function useMosaicImages(photos: Photo[]): {
  imagesRef: React.MutableRefObject<Map<string, HTMLImageElement>>;
  loadVersion: number;
} {
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const map = imagesRef.current;
    let pendingBump = false;

    const scheduleBump = () => {
      if (pendingBump || cancelled) return;
      pendingBump = true;
      requestAnimationFrame(() => {
        if (cancelled) return;
        pendingBump = false;
        setLoadVersion((n) => n + 1);
      });
    };

    for (const photo of photos) {
      if (map.has(photo.id)) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      const onSettle = () => {
        if (cancelled) return;
        scheduleBump();
      };
      img.onload = onSettle;
      img.onerror = onSettle;
      img.src = photo.microUrl;
      map.set(photo.id, img);
    }

    return () => {
      cancelled = true;
    };
  }, [photos]);

  return { imagesRef, loadVersion };
}
