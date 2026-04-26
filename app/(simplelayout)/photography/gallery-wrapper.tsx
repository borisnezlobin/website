"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PhotoFeed } from "@/app/lib/photo-types";
import Lightbox from "./lightbox";
import MobileMosaic from "./mobile-mosaic";
import { useLightbox } from "./use-lightbox";

const DesktopCanvas = dynamic(() => import("./desktop-canvas"), { ssr: false });

const DESKTOP_QUERY = "(min-width: 768px)";

type Mode = "mobile" | "desktop";

export default function GalleryWrapper({ feed }: { feed: PhotoFeed }) {
  const mode = useViewportMode();
  const lightbox = useLightbox(feed.photos.length);

  function openPhotoById(photoId: string) {
    const idx = feed.photos.findIndex((p) => p.id === photoId);
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
          onOpenPhoto={openPhotoById}
        />
      ) : (
        <MobileMosaic
          photos={feed.photos}
          categories={feed.categories}
          onOpenPhoto={openPhotoById}
        />
      )}
      {lightbox.isOpen && (
        <Lightbox
          photos={feed.photos}
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
