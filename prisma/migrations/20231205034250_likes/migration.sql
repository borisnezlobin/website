-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "likes" ON "articles"("likes");
