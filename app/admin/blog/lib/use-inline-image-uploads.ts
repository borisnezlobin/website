import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { INLINE_IMAGE_PATTERN } from "@/app/lib/blog-image-keys";
import { uploadInlineImage } from "./upload-inline-image";
import type { AdminFetch } from "./types";

type InlineImage = {
  dataUri: string;
  url?: string;
  error?: string;
  inFlight?: Promise<void>;
};

export type UploadProgress = { uploaded: number; total: number; failed: number };

const NO_UPLOADS: UploadProgress = { uploaded: 0, total: 0, failed: 0 };

function countProgress(images: Map<string, InlineImage>): UploadProgress {
  let uploaded = 0;
  let failed = 0;
  for (const image of images.values()) {
    if (image.url) uploaded++;
    else if (image.error) failed++;
  }
  return { uploaded, failed, total: images.size };
}

function replaceTokens(html: string, images: Map<string, InlineImage>): string {
  let result = html;
  for (const [token, image] of images) if (image.url) result = result.replaceAll(token, image.url);
  return result;
}

/**
 * Keeps base64 images out of the editor. Pasted HTML has each inline image
 * swapped for a short placeholder token while the image uploads to R2; the
 * token becomes the image's URL when the upload lands. The textarea then holds
 * kilobytes instead of tens of megabytes, and the save request stays small.
 */
export function useInlineImageUploads(adminFetch: AdminFetch, setContent: Dispatch<SetStateAction<string>>) {
  const images = useRef(new Map<string, InlineImage>());
  const tokenByDataUri = useRef(new Map<string, string>());
  const tokensIssued = useRef(0);
  const [progress, setProgress] = useState<UploadProgress>(NO_UPLOADS);

  const startUpload = useCallback(
    (token: string, image: InlineImage) => {
      image.error = undefined;
      image.inFlight = uploadInlineImage(image.dataUri, adminFetch)
        .then((url) => {
          image.url = url;
          setContent((html) => html.replaceAll(token, url));
        })
        .catch((e: unknown) => {
          image.error = e instanceof Error ? e.message : String(e);
        })
        .finally(() => {
          image.inFlight = undefined;
          setProgress(countProgress(images.current));
        });
    },
    [adminFetch, setContent],
  );

  const tokenFor = useCallback(
    (dataUri: string) => {
      const known = tokenByDataUri.current.get(dataUri);
      if (known) return images.current.get(known)?.url ?? known;
      tokensIssued.current += 1;
      const token = `pending-image-${tokensIssued.current}-uploading`;
      const image: InlineImage = { dataUri };
      images.current.set(token, image);
      tokenByDataUri.current.set(dataUri, token);
      startUpload(token, image);
      return token;
    },
    [startUpload],
  );

  const absorb = useCallback(
    (html: string) => {
      if (!html.includes("data:image/")) return html;
      const swapped = html.replace(INLINE_IMAGE_PATTERN, tokenFor);
      setProgress(countProgress(images.current));
      return swapped;
    },
    [tokenFor],
  );

  const finalize = useCallback(
    async (html: string) => {
      const referenced = [...images.current].filter(([token, image]) => !image.url && html.includes(token));
      for (const [token, image] of referenced) if (!image.inFlight) startUpload(token, image);
      setProgress(countProgress(images.current));
      await Promise.all(referenced.map(([, image]) => image.inFlight));

      const stillMissing = referenced.filter(([, image]) => !image.url);
      if (stillMissing.length > 0) {
        const [, first] = stillMissing[0];
        throw new Error(`${stillMissing.length} image(s) didn't upload: ${first.error}`);
      }
      return replaceTokens(html, images.current);
    },
    [startUpload],
  );

  return { absorb, finalize, progress };
}
