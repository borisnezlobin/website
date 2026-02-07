"use client";

import dynamic from "next/dynamic";
import type { PhotoData } from "./gallery";

const Gallery = dynamic(() => import("./gallery"), { ssr: false });

export default function GalleryWrapper({ photos }: { photos: PhotoData[] }) {
  return <Gallery photos={photos} />;
}
