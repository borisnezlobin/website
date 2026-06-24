/**
 * One-shot backfill: pull every inline base64 image out of each article's HTML,
 * upload them to R2 (content-hashed, deduped) via extractImagesToR2, rewrite the
 * HTML to point at R2, then re-upload the slimmed HTML to Vercel Blob and update
 * the article's remoteURL. Idempotent — a second run finds no base64 images and
 * skips every post.
 *
 * Run:   npx tsx -r dotenv/config scripts/extract-blog-images.ts
 *
 * Required env: PROD_POSTGRES_PRISMA_URL, BLOB_READ_WRITE_TOKEN, R2_ACCOUNT_ID,
 *               R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE.
 */

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import db from "../app/lib/db";
import { extractImagesToR2 } from "../app/lib/blog-images";

function localHtmlFor(slug: string): string | null {
  const p = path.resolve(process.cwd(), "html", "blog", `${slug}.html`);
  return existsSync(p) ? readFileSync(p, "utf-8") : null;
}

async function loadHtml(article: { slug: string; remoteURL: string | null }): Promise<string | null> {
  if (article.remoteURL) {
    const res = await fetch(article.remoteURL);
    if (res.ok) return res.text();
    console.warn(`  fetch ${article.remoteURL} -> HTTP ${res.status}, falling back to local file`);
  }
  return localHtmlFor(article.slug);
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)}KB`;

async function main() {
  const articles = await db.article.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, remoteURL: true },
  });
  console.log(`Found ${articles.length} articles.`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of articles) {
    process.stdout.write(`  ${article.slug} ... `);
    try {
      const html = await loadHtml(article);
      if (!html) {
        console.log("no content, skip");
        skipped++;
        continue;
      }

      const before = Buffer.byteLength(html);
      const { html: processed, uploaded, failed: imgFailed } = await extractImagesToR2(article.slug, html);

      if (uploaded === 0) {
        console.log("no inline images, skip");
        skipped++;
        continue;
      }

      const blob = await put(`blog/${article.slug}.html`, processed, {
        allowOverwrite: true,
        access: "public",
        addRandomSuffix: false,
        contentType: "text/html",
      });
      await db.article.update({ where: { id: article.id }, data: { remoteURL: blob.url } });

      const note = imgFailed ? `, ${imgFailed} failed` : "";
      console.log(`ok — ${uploaded} image(s)${note}, ${kb(before)} -> ${kb(Buffer.byteLength(processed))}`);
      migrated++;
    } catch (e) {
      console.log("FAIL");
      console.error("    ", e);
      failed++;
    }
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  if (failed > 0) console.log("Some failed — re-run after fixing. The script is idempotent.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
