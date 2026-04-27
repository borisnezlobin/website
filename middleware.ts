import { NextRequest, NextResponse } from "next/server";

const PHOTO_HOST = "photos.borisnezlobin.com";
const PRIMARY_HOSTS = new Set(["borisnezlobin.com", "www.borisnezlobin.com"]);

// Single-segment paths on the photo host that must NOT be treated as series
// slugs. Anything containing a dot is also passed through (font files, etc.).
const RESERVED_PATHS = new Set([
  "admin", "api", "_next", "blog", "notes", "projects", "contact",
  "photography", "feed.xml", "sitemap.xml", "favicon.ico", "robots.txt",
]);

function isAssetPath(slug: string): boolean {
  return slug.includes(".");
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const url = request.nextUrl;

  if (host === PHOTO_HOST) {
    // photos.borisnezlobin.com/ → /photography
    if (url.pathname === "/") {
      const r = url.clone();
      r.pathname = "/photography";
      return NextResponse.rewrite(r);
    }
    // photos.borisnezlobin.com/{slug} → /photography/series/{slug}
    // Only single-segment, non-asset, non-reserved paths.
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 1) {
      const slug = segments[0];
      if (!isAssetPath(slug) && !RESERVED_PATHS.has(slug)) {
        const r = url.clone();
        r.pathname = `/photography/series/${slug}`;
        return NextResponse.rewrite(r);
      }
    }
    // Multi-segment or reserved paths pass through — they'll resolve normally
    // (or 404 if no matching route).
  }

  if (PRIMARY_HOSTS.has(host)) {
    // borisnezlobin.com/photography/series/{slug} → photos.borisnezlobin.com/{slug}
    if (url.pathname.startsWith("/photography/series/")) {
      const slug = url.pathname.slice("/photography/series/".length).split("/")[0];
      if (slug) {
        return NextResponse.redirect(
          new URL(`https://${PHOTO_HOST}/${slug}${url.search}`),
          307,
        );
      }
    }
    // borisnezlobin.com/photography* (anything else) → photos.borisnezlobin.com/*
    if (url.pathname.startsWith("/photography")) {
      const stripped = url.pathname.replace(/^\/photography/, "") || "/";
      return NextResponse.redirect(
        new URL(`https://${PHOTO_HOST}${stripped}${url.search}`),
        307,
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Exclude /api so the framework's default 10MB body limit doesn't apply to
  // upload endpoints (the middleware doesn't need to touch API routes anyway).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
