-- Three-way article categorization replaces the single isCreative flag.
CREATE TYPE "ArticleCategory" AS ENUM ('TECHNICAL', 'CREATIVE', 'PERSONAL');

ALTER TABLE "Article" ADD COLUMN "category" "ArticleCategory" NOT NULL DEFAULT 'TECHNICAL';

-- Everything previously flagged creative was informal/personal "word-barf"; move it to Personal.
UPDATE "Article" SET "category" = 'PERSONAL' WHERE "isCreative" = true;

-- These two are actual creative writing and stay in Creative.
UPDATE "Article" SET "category" = 'CREATIVE' WHERE slug IN ('all-you-need', 'two-economists');

ALTER TABLE "Article" DROP COLUMN "isCreative";
