import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { revalidatePath, revalidateTag } from "next/cache";
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

function generateDraftUid(): string {
  return Math.random().toString(36).slice(2, 8);
}

const CATEGORIES = ["TECHNICAL", "CREATIVE", "PERSONAL"] as const;
type Category = (typeof CATEGORIES)[number];

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  remoteURL: true,
  createdAt: true,
  views: true,
  isDraft: true,
  category: true,
  draftUid: true,
} as const;

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const post = await db.article.findUnique({
      where: { slug },
      select: {
        title: true,
        slug: true,
        description: true,
        remoteURL: true,
        createdAt: true,
        views: true,
        isDraft: true,
        category: true,
        draftUid: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let content = "";

    if (post.remoteURL) {
      try {
        content = await (await fetch(post.remoteURL)).text();
      } catch (e) {
        console.error("Failed to fetch remote content:", e);
      }
    }

    if (!content) {
      const localPath = path.resolve(process.cwd(), "html", "blog", `${slug}.html`);
      if (existsSync(localPath)) {
        content = readFileSync(localPath, "utf-8");
      }
    }

    return NextResponse.json({ post, content });
  }

  const posts = await db.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      remoteURL: true,
      createdAt: true,
      views: true,
      isDraft: true,
      category: true,
      draftUid: true,
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, content, isDraft, category, description } = await request.json();

  if (!slug || typeof content !== "string") {
    return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
  }

  const post = await db.article.findUnique({ where: { slug } });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Generate a draftUid if this is being saved as a draft and doesn't have one yet
  const draftUid = isDraft && !post.draftUid ? generateDraftUid() : post.draftUid;

  const blob = await put(`blog/${slug}.html`, content, {
    allowOverwrite: true,
    access: "public",
    addRandomSuffix: false,
    contentType: "text/html",
  });

  const updated = await db.article.update({
    where: { slug },
    data: {
      remoteURL: blob.url,
      updatedAt: new Date(),
      ...(isDraft !== undefined && { isDraft }),
      ...(category !== undefined && { category }),
      ...(typeof description === "string" && { description }),
      ...(draftUid && { draftUid }),
    },
  });

  revalidateTag("blogs");
  revalidatePath(`/writing/${slug}`);
  if (updated.draftUid) {
    revalidatePath(`/writing/${slug}-${updated.draftUid}`);
  }

  return NextResponse.json({
    success: true,
    blobUrl: blob.url,
    isDraft: updated.isDraft,
    category: updated.category,
    description: updated.description,
    draftUid: updated.draftUid,
  });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, slug, description, content, category, isDraft } = await request.json();

  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanSlug = typeof slug === "string" ? slug.trim() : "";

  if (!cleanTitle || !cleanSlug) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    return NextResponse.json({ error: "Slug may only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  const existing = await db.article.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    return NextResponse.json({ error: "An article with that slug already exists" }, { status: 409 });
  }

  const html = typeof content === "string" ? content : "";
  const cat: Category = CATEGORIES.includes(category) ? category : "TECHNICAL";
  const draftUid = isDraft ? generateDraftUid() : null;

  let remoteURL: string | null = null;
  if (html.trim()) {
    const blob = await put(`blog/${cleanSlug}.html`, html, {
      allowOverwrite: true,
      access: "public",
      addRandomSuffix: false,
      contentType: "text/html",
    });
    remoteURL = blob.url;
  }

  const created = await db.article.create({
    data: {
      title: cleanTitle,
      slug: cleanSlug,
      description: typeof description === "string" ? description : "",
      body: "",
      category: cat,
      isDraft: !!isDraft,
      ...(remoteURL && { remoteURL }),
      ...(draftUid && { draftUid }),
    },
    select: POST_SELECT,
  });

  revalidateTag("blogs");
  revalidatePath("/writing");
  revalidatePath(`/writing/${cleanSlug}`);

  return NextResponse.json({ success: true, post: created, blobUrl: remoteURL });
}
