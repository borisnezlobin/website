import { Metadata } from "next";
import CONFIG from "./config";

const getMetadata = ({
  title = "",
  description,
  info,
  subtitle,
  img,
}: {
  title?: string;
  description?: string;
  img?: string;
  info?: string;
  subtitle?: string;
}) => {
  const ogUrl = img || (() => {
    const url = new URL("/og", CONFIG.API_URL);
    url.searchParams.set("title", title);
    url.searchParams.set("info", info || "");
    url.searchParams.set("subtitle", subtitle || "");
    return url.toString();
  })();

  return {
    title: title ? title + " / Boris Nezlobin." : "Boris Nezlobin.",
    description: description,
    metadataBase: new URL(CONFIG.API_URL),
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      shortcut: "/favicon.ico",
    },
    openGraph: {
      title: title || "Boris Nezlobin",
      description: description,
      siteName: "Boris Nezlobin",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    twitter: {
      title: title || "Boris Nezlobin",
      card: "summary_large_image",
      author: "@boris_nezlobin",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
  } as Metadata;
};

export default getMetadata;
