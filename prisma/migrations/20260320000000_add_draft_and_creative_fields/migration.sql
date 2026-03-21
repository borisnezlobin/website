ALTER TABLE "Article" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Article" ADD COLUMN "isCreative" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Article" ADD COLUMN "draftUid" TEXT;

-- Backfill flags from slug prefixes
UPDATE "Article" SET "isDraft" = true WHERE slug LIKE 'draft-%';
UPDATE "Article" SET "isCreative" = true WHERE slug LIKE '%personal-%';

-- Generate short random UIDs for all draft articles
UPDATE "Article" SET "draftUid" = SUBSTRING(MD5(RANDOM()::TEXT), 1, 6) WHERE "isDraft" = true;

-- Strip slug prefixes (draft- first, then personal-, handles draft-personal- in two steps)
UPDATE "Article" SET slug = SUBSTRING(slug FROM 7) WHERE slug LIKE 'draft-%';
UPDATE "Article" SET slug = SUBSTRING(slug FROM 10) WHERE slug LIKE 'personal-%';
