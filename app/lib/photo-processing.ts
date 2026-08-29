import sharp from "sharp";
import exifr from "exifr";
import { extractMeanColorOklab, type Vec3 } from "./photo-color";
import { normalizeCamera } from "./camera-names";

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
    // XMP is included because phone exports and edited files often drop the EXIF
    // IFD while keeping the same facts there — without it a photo silently lands
    // with no camera and no date.
    const exif = await exifr.parse(input, { tiff: true, exif: true, xmp: true });
    if (!exif) return {};
    return { camera: readCamera(exif), takenAt: readTakenAt(exif) };
  } catch {
    return {};
  }
}

function readCamera(exif: Record<string, unknown>): string | undefined {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const model = str(exif.Model) ?? str(exif.UniqueCameraModel);
  const make = str(exif.Make);
  return normalizeCamera(make, model);
}

function readTakenAt(exif: Record<string, unknown>): Date | undefined {
  // In preference order: when the shutter fired, when the file was created, then
  // the generic timestamps XMP tooling leaves behind.
  const candidates = [
    exif.DateTimeOriginal,
    exif.CreateDate,
    exif.DateCreated,
    exif.DateTimeDigitized,
    exif.ModifyDate,
  ];
  for (const raw of candidates) {
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    if (typeof raw === "string") {
      // EXIF writes "2024:06:01 12:30:00", which Date can't parse as-is.
      const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}
