import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
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
        isCreative: true,
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
      isCreative: true,
      draftUid: true,
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, content, isDraft, isCreative } = await request.json();

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
      ...(isCreative !== undefined && { isCreative }),
      ...(draftUid && { draftUid }),
    },
  });

  revalidatePath(`/blog/${slug}`);
  if (updated.draftUid) {
    revalidatePath(`/blog/${slug}-${updated.draftUid}`);
  }

  return NextResponse.json({
    success: true,
    blobUrl: blob.url,
    isDraft: updated.isDraft,
    isCreative: updated.isCreative,
    draftUid: updated.draftUid,
  });
}
