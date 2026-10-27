import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/app/lib/admin-auth";
import { deleteFromR2, downloadFromR2, uploadToR2 } from "@/app/lib/r2";
import { blogImageKey, blogImageStagingKey } from "@/app/lib/blog-image-keys";
import { optimizeBlogImage } from "@/app/lib/blog-image-optimize";
import { readImageIdentity } from "../image-identity";

export const maxDuration = 60;

// Reads a staged original from R2, stores the resized WebP under its final
// key, and removes the original. Reading from R2 sidesteps the 4.5 MB limit on
// request bodies that a direct upload to this function would hit.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = readImageIdentity(await request.json());
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 400 });
  const { hash, subtype } = identity;

  const stagingKey = blogImageStagingKey(hash, subtype);
  const stored = await optimizeBlogImage(await downloadFromR2(stagingKey), subtype);
  const publicUrl = await uploadToR2(blogImageKey(hash, subtype), stored.buffer, `image/${stored.subtype}`);
  await deleteFromR2(stagingKey);

  return NextResponse.json({ publicUrl });
}
