import sharp from "sharp";
import { OPTIMIZABLE_SUBTYPES, OPTIMIZED_SUBTYPE } from "./blog-image-keys";

// The article column is 616 px wide; 2400 px covers 3x screens and matches the
// long edge the photography pipeline keeps.
const ARTICLE_IMAGE_LONG_EDGE = 2400;
const ARTICLE_IMAGE_WEBP_QUALITY = 85;

export async function optimizeBlogImage(input: Buffer, subtype: string): Promise<{ buffer: Buffer; subtype: string }> {
  if (!OPTIMIZABLE_SUBTYPES.has(subtype)) return { buffer: input, subtype };
  const buffer = await sharp(input)
    .rotate()
    .resize({ width: ARTICLE_IMAGE_LONG_EDGE, height: ARTICLE_IMAGE_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: ARTICLE_IMAGE_WEBP_QUALITY })
    .toBuffer();
  return { buffer, subtype: OPTIMIZED_SUBTYPE };
}
