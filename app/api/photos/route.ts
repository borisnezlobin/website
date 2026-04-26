import { NextResponse } from "next/server";
import { getPhotoFeed } from "@/app/lib/db-caches";

export const runtime = "nodejs";

export async function GET() {
  const feed = await getPhotoFeed();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=31536000",
    },
  });
}
