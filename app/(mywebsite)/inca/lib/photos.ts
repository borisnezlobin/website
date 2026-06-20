import type { StairSpec } from "./stairs";

export interface StaircasePhoto {
  file: string;
  caption: string;
  spec: StairSpec;
}

export interface SimplePhoto {
  file: string;
  caption: string;
}

export interface CountingItem extends SimplePhoto {
  kind: "image" | "video";
}

export interface PhotoManifest {
  staircases: StaircasePhoto[];
  paving: SimplePhoto[];
  notSteps: SimplePhoto[];
  counting: CountingItem[];
}

// Photos live in /public/inca/photos as webp (video also has .mp4 + _poster.webp).
export const PHOTO_BASE = "/inca/photos";
export const photoUrl = (file: string) => `${PHOTO_BASE}/${file}.webp`;
export const videoUrl = (file: string) => `${PHOTO_BASE}/${file}.mp4`;
export const posterUrl = (file: string) => `${PHOTO_BASE}/${file}_poster.webp`;
