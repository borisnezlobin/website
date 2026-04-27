"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, CameraIcon, HeartIcon } from "@phosphor-icons/react/dist/ssr";
import type { Photo } from "@/app/lib/photo-types";
import { likePhoto } from "./like-photo";

const likedKey = (id: string) => `liked-photo-${id}`;

export default function LightboxInfo({ photo }: { photo: Photo }) {
  return (
    <aside className="w-full md:w-[300px] lg:w-[360px] md:flex-shrink-0 flex flex-col gap-4 md:gap-5 md:max-h-[80vh] md:overflow-y-auto md:pr-2 md:pt-2 md:pb-2">
      <header className="flex flex-col gap-1">
        <h2
          className="vectra text-3xl md:text-4xl text-primary dark:!text-primary-dark"
          style={{ lineHeight: 1.5, paddingTop: 4 }}
        >
          {photo.title}
        </h2>
        {photo.categorySlugs.length > 0 && (
          <p className="text-base text-white/40">
            {photo.categorySlugs.map((slug) => slug.charAt(0).toUpperCase() + slug.slice(1)).join(" · ")}
          </p>
        )}
      </header>

      {photo.description && (
        <p className="text-white/80 text-sm md:text-lg leading-relaxed whitespace-pre-line">
          {photo.description}
        </p>
      )}

      <PhotoMeta photo={photo} />
    </aside>
  );
}

function PhotoMeta({ photo }: { photo: Photo }) {
  const date = photo.takenAt
    ? new Date(photo.takenAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  // Note: <footer> rather than <div> deliberately. The site's bundled
  // obsidian.css has a `div:not(.callout) { color: var(--text-color) }`
  // rule whose specificity (0,1,1) beats Tailwind's `.text-white/60`
  // (0,1,0), so a <div> here loses the color cascade. <footer> isn't in
  // that selector list, so the Tailwind class wins. Same reason child
  // <span>s carry their own `text-white/60` — they'd otherwise hit the
  // obsidian span rule directly.
  return (
    <footer className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-white/10 text-xs text-white/60">
      {photo.camera && (
        <span className="flex items-center gap-2 text-white/60">
          <CameraIcon size={12} weight="bold" />
          {photo.camera}
        </span>
      )}
      {date && (
        <span className="flex items-center gap-2 text-white/60">
          <CalendarIcon size={12} weight="bold" />
          {date}
        </span>
      )}
      <LikeButton photo={photo} />
    </footer>
  );
}

function LikeButton({ photo }: { photo: Photo }) {
  // Persist the liked-state per photo in localStorage so reopening the
  // lightbox after a like still shows the filled heart and bumped count.
  // The server-side count (photo.likes) refreshes on the next page load
  // when the cache tag is revalidated.
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLiked(window.localStorage.getItem(likedKey(photo.id)) === "1");
  }, [photo.id]);

  const displayCount = photo.likes + (liked ? 1 : 0);

  return (
    <button
      onClick={async () => {
        if (liked || pending) return;
        setPending(true);
        setLiked(true);
        window.localStorage.setItem(likedKey(photo.id), "1");
        try {
          await likePhoto(photo.id);
        } catch (e) {
          console.error(e);
          setLiked(false);
          window.localStorage.removeItem(likedKey(photo.id));
        } finally {
          setPending(false);
        }
      }}
      disabled={pending}
      className="flex items-center gap-2 self-start text-white/60 hover:text-white transition-colors disabled:opacity-50"
    >
      <HeartIcon size={12} weight={liked ? "fill" : "regular"} />
      {displayCount}
    </button>
  );
}
