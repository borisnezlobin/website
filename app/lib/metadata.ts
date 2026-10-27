import { Metadata } from "next";
import CONFIG from "./config";

/** A looping preview video for og:video, and the frame of it that stands in where video can't play. */
export type LinkPreviewVideo = { path: string; poster: string; width: number; height: number };

/** Next resolves og:image against metadataBase but leaves og:video as written, and Messages needs it absolute. */
const previewVideo = (video: LinkPreviewVideo) => [
  { url: new URL(video.path, CONFIG.API_URL).toString(), width: video.width, height: video.height, type: "video/mp4" },
];

const getMetadata = ({
  title = "",
  description,
  subtitle,
  img,
  video,
}: {
  title?: string;
  description?: string;
  img?: string;
  subtitle?: string;
  video?: LinkPreviewVideo;
}) => {
  const ogUrl = img || video?.poster || (() => {
    const url = new URL("/og", CONFIG.API_URL);
    url.searchParams.set("title", title || "Ideas, projects, and photographs.");
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
      ...(video && { videos: previewVideo(video) }),
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
