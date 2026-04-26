import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import db from "@/app/lib/db";
import { processPhoto } from "@/app/lib/photo-processing";
import { uploadToR2, deleteFromR2, r2KeysFor } from "@/app/lib/r2";
import { serializePhoto } from "@/app/lib/photo-feed";

export const runtime = "nodejs";
export const maxDuration = 60;

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("ADMIN_PASSWORD not set");
    return false;
  }
  return authHeader === `Bearer ${password}`;
}

function parseCategorySlugs(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === "string");
    } catch {
      // fall through
    }
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

const photoInclude = { categories: { select: { slug: true } } } as const;

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const photo = await db.photograph.findUnique({ where: { id }, include: photoInclude });
    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ photo: serializePhoto(photo as any) });
  }

  const photos = await db.photograph.findMany({
    orderBy: { createdAt: "desc" },
    include: photoInclude,
  });
  return NextResponse.json({ photos: photos.map((p: any) => serializePhoto(p)) });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const slug = formData.get("slug");
  const cameraOverride = formData.get("camera");
  const takenAtOverride = formData.get("takenAt");
  const file = formData.get("image");
  const createdAt = formData.get("createdAt");
  const categorySlugs = parseCategorySlugs(formData.get("categories"));

  if (typeof title !== "string" || !title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processPhoto(buffer);

  const id = `${slug}-${Date.now().toString(36)}`;
  const keys = r2KeysFor(id);
  const [imageUrl, thumbUrl, microUrl] = await Promise.all([
    uploadToR2(keys.full, processed.full, "image/jpeg"),
    uploadToR2(keys.thumb, processed.thumb, "image/jpeg"),
    uploadToR2(keys.micro, processed.micro, "image/jpeg"),
  ]);

  const camera = typeof cameraOverride === "string" && cameraOverride
    ? cameraOverride
    : processed.camera ?? null;
  const takenAt = typeof takenAtOverride === "string" && takenAtOverride
    ? new Date(takenAtOverride)
    : processed.takenAt ?? null;

  const photo = await db.photograph.create({
    data: {
      id,
      title,
      description: typeof description === "string" ? description : "",
      image: imageUrl,
      thumbUrl,
      microUrl,
      width: processed.width,
      height: processed.height,
      color: processed.color,
      camera,
      takenAt,
      slug,
      createdAt: typeof createdAt === "string" && createdAt ? new Date(createdAt) : new Date(),
      ...(categorySlugs.length > 0 && {
        categories: {
          connect: categorySlugs.map((s) => ({ slug: s })),
        },
      }),
    },
    include: photoInclude,
  });

  revalidateTag("photos");

  return NextResponse.json({ success: true, photo: serializePhoto(photo as any) });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await db.photograph.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const slug = formData.get("slug");
  const cameraOverride = formData.get("camera");
  const takenAtOverride = formData.get("takenAt");
  const createdAt = formData.get("createdAt");
  const file = formData.get("image");
  const hasCategories = formData.has("categories");
  const categorySlugs = hasCategories ? parseCategorySlugs(formData.get("categories")) : [];

  let imageUrl = existing.image;
  let thumbUrl = (existing as any).thumbUrl as string | null;
  let microUrl = (existing as any).microUrl as string | null;
  let width = (existing as any).width as number | null;
  let height = (existing as any).height as number | null;
  let color = (existing as any).color as number[];
  let camera = (existing as any).camera as string | null;
  let takenAt = (existing as any).takenAt as Date | null;

  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processPhoto(buffer);
    const keys = r2KeysFor(id);
    [imageUrl, thumbUrl, microUrl] = await Promise.all([
      uploadToR2(keys.full, processed.full, "image/jpeg"),
      uploadToR2(keys.thumb, processed.thumb, "image/jpeg"),
      uploadToR2(keys.micro, processed.micro, "image/jpeg"),
    ]);
    width = processed.width;
    height = processed.height;
    color = processed.color;
    if (processed.camera) camera = processed.camera;
    if (processed.takenAt) takenAt = processed.takenAt;
  }

  if (typeof cameraOverride === "string" && cameraOverride) camera = cameraOverride;
  if (typeof takenAtOverride === "string" && takenAtOverride) takenAt = new Date(takenAtOverride);

  const photo = await db.photograph.update({
    where: { id },
    data: {
      ...(typeof title === "string" && { title }),
      ...(typeof description === "string" && { description }),
      ...(typeof slug === "string" && slug && { slug }),
      image: imageUrl,
      thumbUrl,
      microUrl,
      width,
      height,
      color,
      camera,
      takenAt,
      ...(typeof createdAt === "string" && createdAt && { createdAt: new Date(createdAt) }),
      updatedAt: new Date(),
      ...(hasCategories && {
        categories: {
          set: categorySlugs.map((s) => ({ slug: s })),
        },
      }),
    },
    include: photoInclude,
  });

  revalidateTag("photos");

  return NextResponse.json({ success: true, photo: serializePhoto(photo as any) });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const photo = await db.photograph.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const keys = r2KeysFor(id);
  await Promise.allSettled([
    deleteFromR2(keys.full),
    deleteFromR2(keys.thumb),
    deleteFromR2(keys.micro),
  ]);

  await db.photograph.delete({ where: { id } });
  revalidateTag("photos");

  return NextResponse.json({ success: true });
}
