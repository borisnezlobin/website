import { getPhotographs } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import { Metadata } from "next";
import GalleryWrapper from "./gallery-wrapper";

export const metadata: Metadata = getMetadata({
  title: "Photography",
  description: "My photography (the good stuff).",
});

export default async function PhotographyPage() {
  const photos = await getPhotographs();

  return <GalleryWrapper photos={JSON.parse(JSON.stringify(photos))} />;
}
