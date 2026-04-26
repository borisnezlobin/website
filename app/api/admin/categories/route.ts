import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import db from "@/app/lib/db";
import { serializeCategory } from "@/app/lib/photo-feed";

export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await db.category.findMany({
    orderBy: { label: "asc" },
    include: { _count: { select: { photos: true } } },
  });
  return NextResponse.json({
    categories: categories.map((c: any) => serializeCategory(c)),
  });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }
  const slug = typeof body.slug === "string" && body.slug ? slugify(body.slug) : slugify(label);
  if (!slug) {
    return NextResponse.json({ error: "Could not derive slug from label" }, { status: 400 });
  }
  const heroPhotoId = typeof body.heroPhotoId === "string" ? body.heroPhotoId : null;

  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
  }

  const category = await db.category.create({
    data: { slug, label, heroPhotoId },
    include: { _count: { select: { photos: true } } },
  });
  revalidateTag("photos");
  return NextResponse.json({ success: true, category: serializeCategory(category as any) });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (typeof body.slug === "string" && body.slug) data.slug = slugify(body.slug);
  if ("heroPhotoId" in body) {
    data.heroPhotoId = body.heroPhotoId === null ? null : String(body.heroPhotoId);
  }

  const category = await db.category.update({
    where: { id },
    data,
    include: { _count: { select: { photos: true } } },
  });
  revalidateTag("photos");
  return NextResponse.json({ success: true, category: serializeCategory(category as any) });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await db.category.delete({ where: { id } });
  revalidateTag("photos");
  return NextResponse.json({ success: true });
}
