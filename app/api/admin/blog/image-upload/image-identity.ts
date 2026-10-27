import { BLOG_IMAGE_HASH_PATTERN, UPLOADABLE_SUBTYPES } from "@/app/lib/blog-image-keys";

export type ImageIdentity = { hash: string; subtype: string };

export function readImageIdentity(body: { hash?: unknown; subtype?: unknown }): ImageIdentity | { error: string } {
  const { hash, subtype } = body;
  if (typeof hash !== "string" || !BLOG_IMAGE_HASH_PATTERN.test(hash)) {
    return { error: "Image hash must be 16 lowercase hex characters" };
  }
  if (typeof subtype !== "string" || !UPLOADABLE_SUBTYPES.has(subtype)) {
    return { error: `Unsupported image type: ${String(subtype)}` };
  }
  return { hash, subtype };
}
