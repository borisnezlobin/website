import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import SeriesContent from "../series-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return getMetadata({ title: "Series not found" });
  return getMetadata({
    title: series.title,
    description: series.description || `${series.photos.length} photos in ${series.title}.`,
  });
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();
  const serialized = JSON.parse(JSON.stringify(series));
  return <SeriesContent series={serialized} />;
}
