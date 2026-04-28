import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import db from "@/app/lib/db";
import { serializeSeries, serializeSeriesSummary } from "@/app/lib/photo-feed";

export const runtime = "nodejs";

// Reserved slugs — anything that conflicts with a Next route or that the
// middleware can't safely rewrite to a series view.
const RESERVED_SLUGS = new Set([
  "admin", "api", "_next", "photography", "blog", "notes", "projects",
  "contact", "favicon", "robots", "sitemap", "feed", "p",
]);

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return authHeader === `Bearer ${password}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function bumpCache() {
  revalidateTag("series");
  revalidateTag("photos");
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const row = await db.series.findUnique({
      where: { slug },
      include: {
        photos: {
          orderBy: { position: "asc" },
          include: { photo: { include: { categories: { select: { slug: true } } } } },
        },
      },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ series: serializeSeries(row as any) });
  }

  const rows = await db.series.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });
  return NextResponse.json({ series: rows.map((r: any) => serializeSeriesSummary(r)) });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const slug = typeof body.slug === "string" && body.slug ? slugify(body.slug) : slugify(title);
  if (!slug) return NextResponse.json({ error: "Could not derive slug" }, { status: 400 });
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ error: `'${slug}' is a reserved slug — try a different one.` }, { status: 400 });
  }
  const existing = await db.series.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A series with this slug already exists" }, { status: 409 });

  const description = typeof body.description === "string" ? body.description : "";
  const series = await db.series.create({
    data: { slug, title, description },
    include: { _count: { select: { photos: true } } },
  });
  bumpCache();
  return NextResponse.json({ success: true, series: serializeSeriesSummary(series as any) });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.slug === "string" && body.slug) {
    const newSlug = slugify(body.slug);
    if (RESERVED_SLUGS.has(newSlug)) {
      return NextResponse.json({ error: `'${newSlug}' is a reserved slug.` }, { status: 400 });
    }
    data.slug = newSlug;
  }

  // photoIds is the new ordered list of photo IDs in the series.
  const photoIds = Array.isArray(body.photoIds)
    ? body.photoIds.filter((s: unknown): s is string => typeof s === "string")
    : null;

  const updated = await db.$transaction(async (tx: any) => {
    const series = await tx.series.update({ where: { id }, data });
    if (photoIds) {
      await tx.seriesPhoto.deleteMany({ where: { seriesId: id } });
      if (photoIds.length > 0) {
        await tx.seriesPhoto.createMany({
          data: photoIds.map((photoId: string, position: number) => ({
            seriesId: id,
            photoId,
            position,
          })),
        });
      }
    }
    return tx.series.findUnique({
      where: { id: series.id },
      include: {
        photos: {
          orderBy: { position: "asc" },
          include: { photo: { include: { categories: { select: { slug: true } } } } },
        },
      },
    });
  });

  bumpCache();
  if (updated?.slug) revalidateTag(`series-${updated.slug}`);
  return NextResponse.json({ success: true, series: updated ? serializeSeries(updated as any) : null });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = await db.series.findUnique({ where: { id } });
  await db.series.delete({ where: { id } });
  bumpCache();
  if (existing?.slug) revalidateTag(`series-${existing.slug}`);
  return NextResponse.json({ success: true });
}
