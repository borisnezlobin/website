"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PhotoFeed } from "@/app/lib/photo-types";
import Lightbox from "./lightbox";
import MobileMosaic from "./mobile-mosaic";
import { useLightbox } from "./use-lightbox";

const DesktopCanvas = dynamic(() => import("./desktop-canvas"), { ssr: false });

const DESKTOP_QUERY = "(min-width: 768px)";
// Matches /p/{slug} or /photography/p/{slug} — second segment is captured.
const PHOTO_PATH_RE = /\/p\/([^/?#]+)$/;

type Mode = "mobile" | "desktop";

export default function GalleryWrapper({
  feed,
  initialPhotoSlug,
}: {
  feed: PhotoFeed;
  initialPhotoSlug?: string;
}) {
  const mode = useViewportMode();
  const visiblePhotos = useMemo(
    () => feed.photos.filter((p) => p.inGallery),
    [feed.photos],
  );

  const initialIndex = useMemo(() => {
    if (!initialPhotoSlug) return -1;
    return visiblePhotos.findIndex((p) => p.slug === initialPhotoSlug);
  }, [visiblePhotos, initialPhotoSlug]);

  const lightbox = useLightbox(visiblePhotos.length, initialIndex);

  // Captured at first render so we know whether to write /p/{slug} (production
  // photos host) or /photography/p/{slug} (dev / primary host fallback).
  const basePathRef = useRef<string>("");
  useEffect(() => {
    basePathRef.current = window.location.pathname.startsWith("/photography")
      ? "/photography"
      : "";
  }, []);

  // Tracks the previous lightbox index so we can decide push vs replace:
  //  closed → open: pushState (so browser back closes the lightbox)
  //  open → open (prev/next): replaceState (back doesn't walk through photos)
  //  open → closed (X / Esc): replaceState back to base
  const prevIndexRef = useRef<number>(initialIndex);
  // When popstate fires we sync state from URL — set this so the resulting
  // index change doesn't re-write history (which would either be a no-op or
  // create a loop).
  const skipUrlUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipUrlUpdateRef.current) {
      skipUrlUpdateRef.current = false;
      prevIndexRef.current = lightbox.index;
      return;
    }
    const photo = lightbox.index >= 0 ? visiblePhotos[lightbox.index] : null;
    const targetPath = photo
      ? `${basePathRef.current}/p/${photo.slug}`
      : basePathRef.current || "/";
    if (window.location.pathname === targetPath) {
      prevIndexRef.current = lightbox.index;
      return;
    }
    const wasClosed = prevIndexRef.current < 0;
    const isOpen = lightbox.index >= 0;
    if (wasClosed && isOpen) {
      window.history.pushState(null, "", targetPath);
    } else {
      window.history.replaceState(null, "", targetPath);
    }
    prevIndexRef.current = lightbox.index;
  }, [lightbox.index, visiblePhotos]);

  // Sync from URL when user navigates with browser back/forward.
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = PHOTO_PATH_RE.exec(path);
      if (match) {
        const slug = match[1];
        const idx = visiblePhotos.findIndex((p) => p.slug === slug);
        if (idx >= 0 && idx !== lightbox.index) {
          skipUrlUpdateRef.current = true;
          lightbox.setIndex(idx);
        }
      } else if (lightbox.index >= 0) {
        skipUrlUpdateRef.current = true;
        lightbox.close();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [visiblePhotos, lightbox]);

  function openPhotoById(photoId: string) {
    const idx = visiblePhotos.findIndex((p) => p.id === photoId);
    if (idx >= 0) lightbox.setIndex(idx);
  }

  if (mode === null) {
    return <div className="fixed inset-0 bg-[#0d0b09]" />;
  }

  return (
    <>
      {mode === "desktop" ? (
        <DesktopCanvas
          photos={feed.photos}
          categories={feed.categories}
          series={feed.series}
          onOpenPhoto={openPhotoById}
        />
      ) : (
        <MobileMosaic
          photos={feed.photos}
          categories={feed.categories}
          series={feed.series}
          onOpenPhoto={openPhotoById}
        />
      )}
      {lightbox.isOpen && (
        <Lightbox
          photos={visiblePhotos}
          index={lightbox.index}
          onClose={lightbox.close}
          onNext={lightbox.next}
          onPrev={lightbox.prev}
        />
      )}
    </>
  );
}

function useViewportMode(): Mode | null {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setMode(mq.matches ? "desktop" : "mobile");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mode;
}
