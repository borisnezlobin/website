-- Timestamped per-view rows backing the views-over-time chart. The Article.views
-- counter stays as the cheap running total.
CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_view_article_created" ON "ArticleView"("articleId", "createdAt");

ALTER TABLE "ArticleView"
    ADD CONSTRAINT "ArticleView_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "Article"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
