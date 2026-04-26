import { Metadata } from "next";
import { getPhotoFeed } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import GalleryWrapper from "./gallery-wrapper";

export const metadata: Metadata = getMetadata({
  title: "Photography",
  description: "My photography (the good stuff).",
});

export default async function PhotographyPage() {
  const feed = await getPhotoFeed();
  const serialized = JSON.parse(JSON.stringify(feed));
  return <GalleryWrapper feed={serialized} />;
}
