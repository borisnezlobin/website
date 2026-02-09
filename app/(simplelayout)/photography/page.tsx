import { getPhotographs, getPhotographsCount } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import { Metadata } from "next";
import GalleryWrapper from "./gallery-wrapper";

const MOBILE_PAGE_SIZE = 8;

export const metadata: Metadata = getMetadata({
  title: "Photography",
  description: "My photography (the good stuff).",
});

export default async function PhotographyPage() {
  const [photos, totalCount] = await Promise.all([
    getPhotographs(),
    getPhotographsCount(),
  ]);

  const serialized = JSON.parse(JSON.stringify(photos));

  return (
    <GalleryWrapper
      photos={serialized}
      initialMobilePhotos={serialized.slice(0, MOBILE_PAGE_SIZE)}
      totalCount={totalCount}
      pageSize={MOBILE_PAGE_SIZE}
    />
  );
}
