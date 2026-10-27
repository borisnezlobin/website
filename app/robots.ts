import { MetadataRoute } from "next";
import CONFIG from "./lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: new URL("/sitemap.xml", CONFIG.API_URL).toString(),
  };
}
