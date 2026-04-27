"use client";

/**
 * Optionally re-encode an image at a smaller dimension / quality before
 * upload. Skips entirely if the file is already small or isn't an image.
 *
 * The server (sharp) caps the saved version at 2400px long edge regardless,
 * so capping the upload at 4000px is a safety floor that prevents a 50MP
 * camera JPEG from being shipped over the wire.
 */
export async function compressImageIfLarge(
  file: File,
  options: { maxLongEdge?: number; quality?: number; triggerSizeBytes?: number } = {},
): Promise<{ file: File; compressed: boolean }> {
  const maxLongEdge = options.maxLongEdge ?? 4000;
  const quality = options.quality ?? 0.9;
  const triggerSize = options.triggerSizeBytes ?? 4 * 1024 * 1024;

  if (file.size < triggerSize) return { file, compressed: false };
  if (!file.type.startsWith("image/")) return { file, compressed: false };

  let bitmap: ImageBitmap;
  try {
    // imageOrientation: "from-image" honors EXIF rotation so portrait
    // photos from phones aren't sideways after redraw.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, compressed: false };
  }

  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxLongEdge / longEdge);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, compressed: false };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return { file, compressed: false };

  // If the re-encode somehow produced a larger file (unlikely but possible
  // for tiny PNGs that JPEG can't beat), keep the original.
  if (blob.size >= file.size) return { file, compressed: false };

  const base = file.name.replace(/\.[^/.]+$/, "");
  const compressed = new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
  return { file: compressed, compressed: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
