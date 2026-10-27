import { Metadata } from "next";
import type { Article } from "@/prisma/awooga/client";
import CONFIG from "@/app/lib/config";
import getMetadata from "@/app/lib/metadata";

type ArticleSeoFields = Pick<Article, "title" | "description" | "slug" | "createdAt" | "updatedAt" | "isDraft">;

const AUTHOR = { "@type": "Person", name: "Boris Nezlobin", url: CONFIG.API_URL };

export function articleUrl(slug: string): string {
  return new URL(`/writing/${slug}`, CONFIG.API_URL).toString();
}

export function articleMetadata(post: ArticleSeoFields): Metadata {
  const base = getMetadata({
    title: post.title,
    subtitle: new Date(post.createdAt).toLocaleDateString(),
    description: post.description,
  });

  return {
    ...base,
    alternates: { canonical: articleUrl(post.slug) },
    robots: { index: !post.isDraft, follow: true },
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    openGraph: {
      ...base.openGraph,
      type: "article",
      url: articleUrl(post.slug),
      publishedTime: new Date(post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [AUTHOR.name],
    },
  };
}

function sharedImageUrl(metadata: Metadata): string | undefined {
  const images = metadata.openGraph?.images;
  const first = Array.isArray(images) ? images[0] : images;
  if (!first) return undefined;
  if (typeof first === "string" || first instanceof URL) return first.toString();
  return first.url.toString();
}

export function articleJsonLd(post: ArticleSeoFields) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: sharedImageUrl(articleMetadata(post)),
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: AUTHOR,
    publisher: AUTHOR,
    mainEntityOfPage: articleUrl(post.slug),
  };
}
