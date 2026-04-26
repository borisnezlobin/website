import type { Photo, Category, PhotoFeed } from "./photo-types";

type PhotographRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  thumbUrl: string | null;
  microUrl: string | null;
  width: number | null;
  height: number | null;
  color: number[];
  camera: string | null;
  takenAt: Date | null;
  likes: number;
  categories?: { slug: string }[];
};

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  heroPhotoId: string | null;
  _count?: { photos: number };
};

export function serializePhoto(row: PhotographRow): Photo {
  const width = row.width ?? 0;
  const height = row.height ?? 0;
  const orientation: "h" | "v" = width >= height ? "h" : "v";
  const color: [number, number, number] =
    row.color.length === 3 ? [row.color[0], row.color[1], row.color[2]] : [0.6, 0, 0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    image: row.image,
    thumbUrl: row.thumbUrl ?? row.image,
    microUrl: row.microUrl ?? row.thumbUrl ?? row.image,
    width,
    height,
    orientation,
    color,
    camera: row.camera ?? null,
    takenAt: row.takenAt ? row.takenAt.toISOString() : null,
    likes: row.likes,
    categorySlugs: row.categories?.map((c) => c.slug) ?? [],
  };
}

export function serializeCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    count: row._count?.photos ?? 0,
    heroPhotoId: row.heroPhotoId,
  };
}

export function buildPhotoFeed(photos: PhotographRow[], categories: CategoryRow[]): PhotoFeed {
  return {
    photos: photos.map(serializePhoto),
    categories: categories.map(serializeCategory),
  };
}
