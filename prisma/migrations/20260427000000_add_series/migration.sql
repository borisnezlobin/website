-- Series model
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
CREATE INDEX "series_slug" ON "Series"("slug");

-- Ordered join table photo ↔ series
CREATE TABLE "SeriesPhoto" (
    "seriesId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SeriesPhoto_pkey" PRIMARY KEY ("seriesId", "photoId")
);

CREATE INDEX "series_photo_position" ON "SeriesPhoto"("seriesId", "position");

ALTER TABLE "SeriesPhoto"
    ADD CONSTRAINT "SeriesPhoto_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeriesPhoto"
    ADD CONSTRAINT "SeriesPhoto_photoId_fkey"
    FOREIGN KEY ("photoId") REFERENCES "Photograph"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
