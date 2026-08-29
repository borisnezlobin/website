"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Photo, PhotoFeed } from "@/app/lib/photo-types";
import Lightbox from "./lightbox";
import Gallery from "./gallery";
import { useLightbox } from "./use-lightbox";
import { useGallerySelection } from "./use-gallery-selection";

// Matches /p/{slug} or /photography/p/{slug} — second segment is captured.
const PHOTO_PATH_RE = /\/p\/([^/?#]+)$/;

export default function GalleryWrapper({
  feed,
  initialPhotoSlug,
}: {
  feed: PhotoFeed;
  initialPhotoSlug?: string;
}) {
  const selection = useGallerySelection(feed.photos, feed.categories);
  const { galleryPhotos, visiblePhotos } = selection;

  // The arrows walk exactly the list the photo was opened from — normally the
  // grid's current category and order. A mosaic tile can be a photo the active
  // filter excludes, so that opens against the full set instead. Frozen while
  // open so a re-shuffle underneath can't move the photo you're looking at.
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>(galleryPhotos);

  const initialIndex = useMemo(() => {
    if (!initialPhotoSlug) return -1;
    return galleryPhotos.findIndex((p) => p.slug === initialPhotoSlug);
  }, [galleryPhotos, initialPhotoSlug]);

  const lightbox = useLightbox(lightboxPhotos.length, initialIndex);

  useEffect(() => {
    if (!lightbox.isOpen) setLightboxPhotos(galleryPhotos);
  }, [galleryPhotos, lightbox.isOpen]);

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
    const photo = lightbox.index >= 0 ? lightboxPhotos[lightbox.index] : null;
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
  }, [lightbox.index, lightboxPhotos]);

  // Sync from URL when user navigates with browser back/forward.
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = PHOTO_PATH_RE.exec(path);
      if (match) {
        const slug = match[1];
        const idx = lightboxPhotos.findIndex((p) => p.slug === slug);
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
  }, [lightboxPhotos, lightbox]);

  function openPhotoById(photoId: string) {
    const list = galleryPhotos.some((p) => p.id === photoId) ? galleryPhotos : visiblePhotos;
    const idx = list.findIndex((p) => p.id === photoId);
    if (idx < 0) return;
    setLightboxPhotos(list);
    lightbox.setIndex(idx);
  }

  return (
    <>
      <Gallery
        photos={feed.photos}
        series={feed.series}
        selection={selection}
        onOpenPhoto={openPhotoById}
      />
      {lightbox.isOpen && (
        <Lightbox
          photos={lightboxPhotos}
          index={lightbox.index}
          onClose={lightbox.close}
          onNext={lightbox.next}
          onPrev={lightbox.prev}
        />
      )}
    </>
  );
}
