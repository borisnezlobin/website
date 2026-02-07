import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import db from "@/app/lib/db";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error("ADMIN_PASSWORD not set");
    return false;
  }

  return authHeader === `Bearer ${password}`;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const photo = await db.photograph.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ photo });
  }

  const photos = await db.photograph.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const slug = formData.get("slug") as string;
  const imageFile = formData.get("image") as File | null;
  const createdAt = formData.get("createdAt") as string | null;

  if (!title || !slug || !imageFile) {
    return NextResponse.json({ error: "Missing required fields (title, slug, image)" }, { status: 400 });
  }

  const blob = await put(`photography/${slug}/${imageFile.name}`, imageFile, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const photo = await db.photograph.create({
    data: {
      title,
      description: description || "",
      image: blob.url,
      slug,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    },
  });

  return NextResponse.json({ success: true, photo });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const slug = formData.get("slug") as string | null;
  const imageFile = formData.get("image") as File | null;
  const createdAt = formData.get("createdAt") as string | null;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await db.photograph.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let imageUrl = existing.image;
  if (imageFile && imageFile.size > 0) {
    const targetSlug = slug || existing.slug;
    const blob = await put(`photography/${targetSlug}/${imageFile.name}`, imageFile, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    imageUrl = blob.url;
  }

  const photo = await db.photograph.update({
    where: { id },
    data: {
      ...(title !== null && { title }),
      ...(description !== null && { description }),
      ...(slug !== null && { slug }),
      image: imageUrl,
      ...(createdAt && { createdAt: new Date(createdAt) }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, photo });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const photo = await db.photograph.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await del(photo.image);
  } catch (e) {
    console.error("Failed to delete blob:", e);
  }

  await db.photograph.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
