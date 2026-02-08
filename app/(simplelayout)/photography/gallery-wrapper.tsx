"use client";

import dynamic from "next/dynamic";
import type { PhotoData } from "./gallery";
import MobileGallery from "./mobile-gallery";

const Gallery = dynamic(() => import("./gallery"), { ssr: false });

export default function GalleryWrapper({ photos }: { photos: PhotoData[] }) {
    return (
        <>
            <div className="hidden md:block w-full h-full">
                <Gallery photos={photos} />
            </div>
            <div className="block md:hidden">
                <MobileGallery photos={photos} />
            </div>
        </>
    );
}
