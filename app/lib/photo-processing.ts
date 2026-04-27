import sharp from "sharp";
import exifr from "exifr";
import { extractMeanColorOklab, type Vec3 } from "./photo-color";

export type ProcessedPhoto = {
  full: Buffer;
  thumb: Buffer;
  micro: Buffer;
  width: number;
  height: number;
  color: Vec3;
  camera?: string;
  takenAt?: Date;
};

const FULL_LONG_EDGE = 2400;
const THUMB_LONG_EDGE = 600;
const MICRO_SIZE = 32;

export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  const oriented = await sharp(input).rotate().toBuffer();

  const fullResult = await sharp(oriented)
    .resize({ width: FULL_LONG_EDGE, height: FULL_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(oriented)
    .resize({ width: THUMB_LONG_EDGE, height: THUMB_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const micro = await sharp(oriented)
    .resize({ width: MICRO_SIZE, height: MICRO_SIZE, fit: "cover" })
    .jpeg({ quality: 70 })
    .toBuffer();

  // Sample the same 32×32 cropped square that becomes the rendered tile, so
  // the stored mean color matches what the eye actually perceives at tile size.
  const sample = await sharp(oriented)
    .resize({ width: MICRO_SIZE, height: MICRO_SIZE, fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = sample.info.width * sample.info.height;
  const color = extractMeanColorOklab(sample.data, pixelCount);

  const exif = await readExif(input);

  return {
    full: fullResult.data,
    thumb,
    micro,
    width: fullResult.info.width,
    height: fullResult.info.height,
    color,
    camera: exif.camera,
    takenAt: exif.takenAt,
  };
}

async function readExif(input: Buffer): Promise<{ camera?: string; takenAt?: Date }> {
  try {
    const exif = await exifr.parse(input, { tiff: true, exif: true });
    if (!exif) return {};
    const make = typeof exif.Make === "string" ? exif.Make.trim() : "";
    const model = typeof exif.Model === "string" ? exif.Model.trim() : "";
    const camera = model ? (make && !model.startsWith(make) ? `${make} ${model}` : model) : undefined;
    let takenAt: Date | undefined;
    const raw = exif.DateTimeOriginal ?? exif.CreateDate;
    if (raw instanceof Date && !isNaN(raw.getTime())) takenAt = raw;
    else if (typeof raw === "string") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) takenAt = d;
    }
    return { camera, takenAt };
  } catch {
    return {};
  }
}
