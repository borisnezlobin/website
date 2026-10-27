import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/app/lib/admin-auth";
import { existsInR2, presignR2Upload, r2UrlFor } from "@/app/lib/r2";
import {
  BLOG_IMAGE_CACHE_CONTROL,
  OPTIMIZABLE_SUBTYPES,
  blogImageKey,
  blogImageStagingKey,
} from "@/app/lib/blog-image-keys";
import { readImageIdentity } from "./image-identity";

// Hands the editor a presigned R2 URL so image bytes never pass through a
// Vercel function. Stills go to a staging key for the optimize route to
// convert; anything already stored is returned without another upload.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = readImageIdentity(await request.json());
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 400 });
  const { hash, subtype } = identity;

  const finalKey = blogImageKey(hash, subtype);
  if (await existsInR2(finalKey)) {
    return NextResponse.json({ publicUrl: r2UrlFor(finalKey) });
  }

  const needsOptimizing = OPTIMIZABLE_SUBTYPES.has(subtype);
  const uploadKey = needsOptimizing ? blogImageStagingKey(hash, subtype) : finalKey;
  const contentType = `image/${subtype}`;
  const { uploadUrl } = await presignR2Upload(uploadKey, contentType, BLOG_IMAGE_CACHE_CONTROL);

  return NextResponse.json({
    uploadUrl,
    contentType,
    cacheControl: BLOG_IMAGE_CACHE_CONTROL,
    needsOptimizing,
    publicUrl: needsOptimizing ? undefined : r2UrlFor(finalKey),
  });
}
