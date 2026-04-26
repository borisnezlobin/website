/**
 * One-shot migration: download each photo's current image (Vercel Blob URL)
 * back through sharp, derive full / thumb / micro, sample dominant color in
 * OKLab, upload all three to Cloudflare R2, then update the DB row with the
 * new URLs and metadata.
 *
 * Run:   npx tsx -r dotenv/config scripts/migrate-blob-to-r2.ts
 *
 * Required env: PROD_POSTGRES_PRISMA_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *               R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE.
 *
 * The original Vercel Blob entries are NOT deleted — verify R2 looks good,
 * then remove them manually with `vercel blob rm`.
 */

import "dotenv/config";
import db from "../app/lib/db";
import { processPhoto } from "../app/lib/photo-processing";
import { uploadToR2, r2KeysFor } from "../app/lib/r2";

type Stats = { migrated: number; skipped: number; failed: number };

async function migrateOne(photo: any, stats: Stats) {
  if (photo.thumbUrl && photo.microUrl && photo.color?.length === 3) {
    console.log(`  skip  ${photo.slug} (already migrated)`);
    stats.skipped++;
    return;
  }
  process.stdout.write(`  ${photo.slug} ... `);
  try {
    const res = await fetch(photo.image);
    if (!res.ok) throw new Error(`fetch ${photo.image} -> HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const processed = await processPhoto(buffer);
    const keys = r2KeysFor(photo.id);
    const [imageUrl, thumbUrl, microUrl] = await Promise.all([
      uploadToR2(keys.full, processed.full, "image/jpeg"),
      uploadToR2(keys.thumb, processed.thumb, "image/jpeg"),
      uploadToR2(keys.micro, processed.micro, "image/jpeg"),
    ]);
    await db.photograph.update({
      where: { id: photo.id },
      data: {
        image: imageUrl,
        thumbUrl,
        microUrl,
        width: processed.width,
        height: processed.height,
        color: processed.color,
        camera: processed.camera ?? photo.camera ?? null,
        takenAt: processed.takenAt ?? photo.takenAt ?? null,
      },
    });
    console.log("ok");
    stats.migrated++;
  } catch (e) {
    console.log("FAIL");
    console.error("    ", e);
    stats.failed++;
  }
}

async function main() {
  const photos = await db.photograph.findMany({ orderBy: { createdAt: "asc" } });
  console.log(`Found ${photos.length} photos in DB.`);

  const stats: Stats = { migrated: 0, skipped: 0, failed: 0 };
  for (const photo of photos) {
    await migrateOne(photo, stats);
  }

  console.log(`\nDone. migrated=${stats.migrated} skipped=${stats.skipped} failed=${stats.failed}`);
  if (stats.failed === 0) {
    console.log("Verify R2 contents look right, then remove the old Vercel Blob entries manually.");
  } else {
    console.log("Some failed — re-run after fixing. The script is idempotent.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
