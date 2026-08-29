/**
 * Rewrite existing `camera` values through the same normaliser new uploads use,
 * so the library doesn't carry two spellings of the same body (e.g. both
 * "SONY ILCE-6700" and "Sony a6700").
 *
 * Dry run:  npx tsx -r dotenv/config scripts/normalize-camera-names.ts
 * Apply:    npx tsx -r dotenv/config scripts/normalize-camera-names.ts --apply
 *
 * NOTE: this writes to the production database. Run the dry run first.
 */

import "dotenv/config";
import db from "../app/lib/db";
import { normalizeCameraString } from "../app/lib/camera-names";

async function main() {
  const apply = process.argv.includes("--apply");
  const photos = await db.photograph.findMany({
    select: { id: true, slug: true, camera: true, takenAt: true },
    orderBy: { createdAt: "desc" },
  });

  const changes = photos
    .map((p) => ({ ...p, next: normalizeCameraString(p.camera) ?? null }))
    .filter((p) => p.camera !== p.next);

  const missingCamera = photos.filter((p) => !p.camera);
  const missingDate = photos.filter((p) => !p.takenAt);

  console.log(`${photos.length} photos`);
  console.log(`  missing camera: ${missingCamera.length}`);
  console.log(`  missing date:   ${missingDate.length}`);
  console.log(`  camera renames: ${changes.length}\n`);

  for (const c of changes) {
    console.log(`  ${c.slug}\n    ${JSON.stringify(c.camera)} -> ${JSON.stringify(c.next)}`);
  }

  if (missingCamera.length || missingDate.length) {
    console.log("\nPhotos still missing metadata (EXIF is stripped from the stored");
    console.log("JPEGs, so these can only be fixed by hand or by re-uploading the original):");
    for (const p of photos) {
      if (p.camera && p.takenAt) continue;
      const gaps = [!p.camera && "camera", !p.takenAt && "date"].filter(Boolean).join(" + ");
      console.log(`  ${p.slug} — no ${gaps}`);
    }
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write these changes.");
    return;
  }

  for (const c of changes) {
    await db.photograph.update({ where: { id: c.id }, data: { camera: c.next } });
  }
  console.log(`\nUpdated ${changes.length} rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
