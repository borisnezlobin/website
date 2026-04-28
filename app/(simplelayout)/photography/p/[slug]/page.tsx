import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPhotoFeed } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import GalleryWrapper from "../../gallery-wrapper";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const feed = await getPhotoFeed();
  const photo = feed.photos.find((p) => p.slug === slug && p.inGallery);
  if (!photo) return getMetadata({ title: "Photo not found" });
  return getMetadata({
    title: photo.title,
    description: photo.description || `${photo.title} — photo by Boris Nezlobin.`,
    img: photo.image,
  });
}

export default async function PhotoPage({ params }: Props) {
  const { slug } = await params;
  const feed = await getPhotoFeed();
  const exists = feed.photos.some((p) => p.slug === slug && p.inGallery);
  if (!exists) notFound();
  const serialized = JSON.parse(JSON.stringify(feed));
  return <GalleryWrapper feed={serialized} initialPhotoSlug={slug} />;
}
