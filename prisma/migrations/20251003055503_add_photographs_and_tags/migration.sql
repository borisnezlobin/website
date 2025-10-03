-- CreateTable
CREATE TABLE "Photograph" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photograph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotographTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotographTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PhotographToPhotographTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Photograph_slug_key" ON "Photograph"("slug");

-- CreateIndex
CREATE INDEX "photographs_created_at" ON "Photograph"("createdAt");

-- CreateIndex
CREATE INDEX "photographs_title" ON "Photograph"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographTag_name_key" ON "PhotographTag"("name");

-- CreateIndex
CREATE INDEX "photograph_tags_name" ON "PhotographTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_PhotographToPhotographTag_AB_unique" ON "_PhotographToPhotographTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PhotographToPhotographTag_B_index" ON "_PhotographToPhotographTag"("B");

-- AddForeignKey
ALTER TABLE "_PhotographToPhotographTag" ADD CONSTRAINT "_PhotographToPhotographTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Photograph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhotographToPhotographTag" ADD CONSTRAINT "_PhotographToPhotographTag_B_fkey" FOREIGN KEY ("B") REFERENCES "PhotographTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
