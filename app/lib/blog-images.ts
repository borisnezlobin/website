import { createHash } from "crypto";
import { uploadToR2 } from "./r2";

const DATA_URI_PATTERN = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})/g;

const EXTENSION_BY_SUBTYPE: Record<string, string> = {
  jpeg: "jpg",
  "svg+xml": "svg",
  "x-icon": "ico",
};

function extensionForSubtype(subtype: string): string {
  return EXTENSION_BY_SUBTYPE[subtype] ?? subtype.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

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
 * the decoded bytes to R2 under a content-hashed key — so identical images
 * dedupe and re-saving the same post is idempotent — then rewrites each URI to
 * its public R2 URL. An image that fails to upload keeps its inline base64, so a
 * save degrades to the old behaviour rather than breaking.
 */
export async function extractImagesToR2(slug: string, html: string): Promise<ImageExtractionResult> {
  const uniqueUris = new Map<string, { subtype: string; data: string }>();
  for (const [uri, subtype, data] of html.matchAll(DATA_URI_PATTERN)) {
    if (!uniqueUris.has(uri)) uniqueUris.set(uri, { subtype, data });
  }

  let result = html;
  let uploaded = 0;
  let failed = 0;

  for (const [uri, { subtype, data }] of uniqueUris) {
    try {
      const buffer = Buffer.from(data, "base64");
      const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
      const key = `blog/${slug}/${hash}.${extensionForSubtype(subtype)}`;
      const url = await uploadToR2(key, buffer, `image/${subtype}`);
      result = result.replaceAll(uri, url);
      uploaded++;
    } catch (e) {
      console.error(`Failed to upload inline image for ${slug}:`, e);
      failed++;
    }
  }

  if (uploaded > 0) result = addLazyLoading(result);

  return { html: result, uploaded, failed };
}
