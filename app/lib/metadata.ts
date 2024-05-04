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
  const ogUrl =
    img ||
    `${CONFIG.API_URL}/og?title=${title || ""}&info=${info || ""}&subtitle=${subtitle || ""}`;

  return {
    title: title + " / Boris Nezlobin",
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
          width: 1920,
          height: 1080,
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
          width: 1920,
          height: 1080,
        },
      ],
    },
  } as Metadata;
};

export default getMetadata;
