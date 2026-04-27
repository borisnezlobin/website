import { NextRequest, NextResponse } from "next/server";

const PHOTO_HOST = "photos.borisnezlobin.com";
const PRIMARY_HOSTS = new Set(["borisnezlobin.com", "www.borisnezlobin.com"]);

export function middleware(request: NextRequest) {
  // Strip any port and lowercase to make host comparisons reliable.
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const url = request.nextUrl;

  // photos.borisnezlobin.com → serve /photography at the root.
  // Other paths (font files in /public, /admin, etc.) pass through unchanged
  // so static assets can load.
  if (host === PHOTO_HOST && url.pathname === "/") {
    const rewritten = url.clone();
    rewritten.pathname = "/photography";
    return NextResponse.rewrite(rewritten);
  }

  // borisnezlobin.com/photography*  →  redirect to photos.borisnezlobin.com/*
  if (PRIMARY_HOSTS.has(host) && url.pathname.startsWith("/photography")) {
    const stripped = url.pathname.replace(/^\/photography/, "") || "/";
    const target = new URL(`https://${PHOTO_HOST}${stripped}${url.search}`);
    return NextResponse.redirect(target, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
