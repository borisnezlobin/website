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
  // Whether this photo appears on the main /photography page (canvas + gallery
  // grid). Hidden photos are still used for mosaic tiles and can still belong
  // to series.
  inGallery: boolean;
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
  series: SeriesSummary[];
};

export type SeriesSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  count: number;
  // First few photos in series order — used to render a visual cover (e.g.,
  // a layered photo stack) on the canvas and mobile series strip without
  // requiring a separate fetch per series.
  coverPhotos: Photo[];
};

export type Series = {
  id: string;
  slug: string;
  title: string;
  description: string;
  photos: Photo[];
};
