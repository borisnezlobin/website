import { createHash } from "crypto";
import { uploadToR2 } from "./r2";
import { INLINE_IMAGE_PATTERN, blogImageKey } from "./blog-image-keys";
import { optimizeBlogImage } from "./blog-image-optimize";

function addLazyLoading(html: string): string {
  return html.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy"');
}

export interface ImageExtractionResult {
  html: string;
  uploaded: number;
  failed: number;
}

/**
 * Pulls every inline base64 `data:image` URI out of an article's HTML, uploads
 * each image to R2 (raster stills resized and converted to WebP) under a
 * content-hashed key — so identical images dedupe across posts and re-saving is
 * idempotent — then rewrites each URI to its public R2 URL. An image that fails to upload keeps its inline base64, so a
 * save degrades to the old behaviour rather than breaking.
 */
export async function extractImagesToR2(slug: string, html: string): Promise<ImageExtractionResult> {
  const uniqueUris = new Map<string, { subtype: string; data: string }>();
  for (const [uri, subtype, data] of html.matchAll(INLINE_IMAGE_PATTERN)) {
    if (!uniqueUris.has(uri)) uniqueUris.set(uri, { subtype, data });
  }

  let result = html;
  let uploaded = 0;
  let failed = 0;

  for (const [uri, { subtype, data }] of uniqueUris) {
    try {
      const original = Buffer.from(data, "base64");
      const hash = createHash("sha256").update(original).digest("hex").slice(0, 16);
      const stored = await optimizeBlogImage(original, subtype);
      const url = await uploadToR2(blogImageKey(hash, subtype), stored.buffer, `image/${stored.subtype}`);
      result = result.replaceAll(uri, url);
      uploaded++;
    } catch (e) {
      console.error(`Failed to upload inline image for ${slug}:`, e);
      failed++;
    }
  }

  return { html: addLazyLoading(result), uploaded, failed };
}
