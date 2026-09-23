-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('GENERATED', 'DECLINED', 'FAILED');

-- CreateTable
CREATE TABLE "ResumeRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "jobUrl" TEXT,
    "slug" TEXT,
    "company" TEXT,
    "focus" TEXT,
    "status" "ResumeStatus" NOT NULL,
    "declineReason" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "latencyMs" INTEGER,
    "plan" JSONB,
    "research" JSONB,
    "pdfUrl" TEXT,
    "pageSvgUrls" TEXT[],
    "ipHash" TEXT,
    "slugDeletedAt" TIMESTAMP(3),

    CONSTRAINT "ResumeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeRequest_slug_key" ON "ResumeRequest"("slug");

-- CreateIndex
CREATE INDEX "ResumeRequest_createdAt_idx" ON "ResumeRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeRequest_normalizedQuery_idx" ON "ResumeRequest"("normalizedQuery");

-- CreateIndex
CREATE INDEX "ResumeRequest_ipHash_createdAt_idx" ON "ResumeRequest"("ipHash", "createdAt");
