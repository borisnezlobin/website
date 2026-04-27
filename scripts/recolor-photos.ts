/**
 * Recompute every photo's `color` (mean OKLab) from its already-uploaded
 * micro on R2. Use this after the dominant→mean color switch to refresh
 * existing rows without re-uploading anything.
 *
 * Run: npx tsx -r dotenv/config scripts/recolor-photos.ts
 */

import "dotenv/config";
import sharp from "sharp";
import db from "../app/lib/db";
import { extractMeanColorOklab } from "../app/lib/photo-color";

async function recolorOne(photo: { id: string; slug: string; microUrl: string | null; image: string }) {
  const url = photo.microUrl ?? photo.image;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const color = extractMeanColorOklab(data, info.width * info.height);
  await db.photograph.update({ where: { id: photo.id }, data: { color } });
}

async function main() {
  const photos = await db.photograph.findMany({
    select: { id: true, slug: true, microUrl: true, image: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Recoloring ${photos.length} photos...`);
  let ok = 0;
  let failed = 0;
  for (const p of photos) {
    process.stdout.write(`  ${p.slug} ... `);
    try {
      await recolorOne(p);
      console.log("ok");
      ok++;
    } catch (e) {
      console.log("FAIL");
      console.error("    ", e);
      failed++;
    }
  }
  console.log(`\nDone. updated=${ok} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
