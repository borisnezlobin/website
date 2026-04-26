-- Drop unused PhotographTag tables
DROP TABLE IF EXISTS "_PhotographToPhotographTag";
DROP TABLE IF EXISTS "PhotographTag";

-- Extend Photograph with derived-image URLs, dimensions, dominant color, and EXIF-style fields.
-- description column is in the schema but may not exist in DB yet (added via db push), so use IF NOT EXISTS.
ALTER TABLE "Photograph" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Photograph" ADD COLUMN "thumbUrl" TEXT;
ALTER TABLE "Photograph" ADD COLUMN "microUrl" TEXT;
ALTER TABLE "Photograph" ADD COLUMN "width" INTEGER;
ALTER TABLE "Photograph" ADD COLUMN "height" INTEGER;
ALTER TABLE "Photograph" ADD COLUMN "color" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[];
ALTER TABLE "Photograph" ADD COLUMN "camera" TEXT;
ALTER TABLE "Photograph" ADD COLUMN "takenAt" TIMESTAMP(3);

-- Categories
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "heroPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "category_slug" ON "Category"("slug");

ALTER TABLE "Category"
    ADD CONSTRAINT "Category_heroPhotoId_fkey"
    FOREIGN KEY ("heroPhotoId") REFERENCES "Photograph"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Photograph <-> Category m2m (Prisma orders A/B alphabetically by model name: A=Category, B=Photograph)
CREATE TABLE "_PhotographCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_PhotographCategories_AB_unique" ON "_PhotographCategories"("A", "B");
CREATE INDEX "_PhotographCategories_B_index" ON "_PhotographCategories"("B");
ALTER TABLE "_PhotographCategories"
    ADD CONSTRAINT "_PhotographCategories_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PhotographCategories"
    ADD CONSTRAINT "_PhotographCategories_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Photograph"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
