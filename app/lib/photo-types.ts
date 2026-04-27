export type Photo = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  thumbUrl: string;
  microUrl: string;
  width: number;
  height: number;
  orientation: "h" | "v";
  color: [number, number, number];
  camera: string | null;
  takenAt: string | null;
  likes: number;
  categorySlugs: string[];
};

export type Category = {
  id: string;
  slug: string;
  label: string;
  count: number;
  heroPhotoId: string | null;
};

export type PhotoFeed = {
  photos: Photo[];
  categories: Category[];
};

export type SeriesSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  count: number;
};

export type Series = {
  id: string;
  slug: string;
  title: string;
  description: string;
  photos: Photo[];
};
