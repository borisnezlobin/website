import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
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

function slugToFileName(slug: string): string {
  return slug.replaceAll("draft-", "").replaceAll("personal-", "");
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
      const localPath = path.resolve(process.cwd(), "html", "blog", `${slugToFileName(slug)}.html`);
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
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, content } = await request.json();

  if (!slug || typeof content !== "string") {
    return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
  }

  const post = await db.article.findUnique({
    where: { slug },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const fileName = slugToFileName(slug);

  const localDir = path.resolve(process.cwd(), "html", "blog");
  if (!existsSync(localDir)) {
    mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(localDir, `${fileName}.html`);
  writeFileSync(localPath, content, "utf-8");

  const blob = await put(`blog/${fileName}.html`, content, {
    allowOverwrite: true,
    access: "public",
    addRandomSuffix: false,
    contentType: "text/html",
  });

  console.log("Uploaded content to blob storage at", blob.url);

  const updated = await db.article.update({
    where: { slug },
    data: {
      remoteURL: blob.url,
      updatedAt: new Date(),
    },
  });

  console.log("Updated database record for post", slug);
  console.log("Verified remoteURL in DB:", updated.remoteURL);

  return NextResponse.json({
    success: true,
    localPath,
    blobUrl: blob.url,
    dbRemoteURL: updated.remoteURL,
  });
}
