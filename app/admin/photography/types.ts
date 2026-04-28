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

export type Message = { type: "success" | "error"; text: string };
