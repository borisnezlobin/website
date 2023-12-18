-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "image" TEXT NOT NULL DEFAULT 'https://cdn3.emoji.gg/emojis/6118_Wesh.png';

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "image" TEXT;
