export const INLINE_IMAGE_PATTERN = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})/g;

const EXTENSION_BY_SUBTYPE: Record<string, string> = {
  jpeg: "jpg",
  "svg+xml": "svg",
  "x-icon": "ico",
};

export function extensionForSubtype(subtype: string): string {
  return EXTENSION_BY_SUBTYPE[subtype] ?? subtype.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export const BLOG_IMAGE_HASH_PATTERN = /^[0-9a-f]{16}$/;

export const UPLOADABLE_SUBTYPES = new Set(["png", "jpeg", "gif", "webp", "avif", "svg+xml"]);

// Raster stills get resized and re-encoded as WebP. GIFs keep their animation
// and SVGs stay vector, so those two are stored exactly as uploaded.
export const OPTIMIZABLE_SUBTYPES = new Set(["png", "jpeg", "webp", "avif"]);

export const OPTIMIZED_SUBTYPE = "webp";

export function storedSubtypeFor(subtype: string): string {
  return OPTIMIZABLE_SUBTYPES.has(subtype) ? OPTIMIZED_SUBTYPE : subtype;
}

// Keyed by a hash of the original bytes, so the same source image always lands
// on the same key whichever path uploaded it, and re-uploads are skipped.
export function blogImageKey(hash: string, subtype: string): string {
  return `blog/images/${hash}.${extensionForSubtype(storedSubtypeFor(subtype))}`;
}

export function blogImageStagingKey(hash: string, subtype: string): string {
  return `blog/uploads/${hash}.${extensionForSubtype(subtype)}`;
}

export const BLOG_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";
