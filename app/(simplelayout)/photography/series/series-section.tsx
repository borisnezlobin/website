"use client";

import { CalendarIcon, CameraIcon } from "@phosphor-icons/react/dist/ssr";
import type { Photo } from "@/app/lib/photo-types";

type Props = {
  photo: Photo;
  index: number;
  total: number;
  onOpenFullscreen: (photo: Photo) => void;
};

export default function SeriesSection({ photo, index, total, onOpenFullscreen }: Props) {
  // Even sections have the photo on the left, odd on the right.
  const photoOnLeft = index % 2 === 0;
  const date = photo.takenAt
    ? new Date(photo.takenAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <section
      className="snap-start h-[100svh] w-full flex flex-col md:flex-row items-stretch px-4 md:px-12 py-8 gap-6 md:gap-12"
      aria-label={photo.title}
    >
      <div
        className={`flex-1 min-h-0 flex items-center justify-center ${
          photoOnLeft ? "md:order-1" : "md:order-2"
        }`}
      >
        <button
          onClick={() => onOpenFullscreen(photo)}
          className="block max-w-full max-h-full"
          aria-label={`View ${photo.title} at full size`}
        >
          <img
            src={photo.image}
            alt={photo.title}
            crossOrigin="anonymous"
            decoding="async"
            loading={index < 2 ? "eager" : "lazy"}
            className="max-w-full max-h-[80svh] md:max-h-[84svh] object-contain rounded shadow-xl cursor-zoom-in"
          />
        </button>
      </div>

      <aside
        className={`md:w-[320px] lg:w-[380px] md:flex-shrink-0 flex flex-col justify-center gap-4 ${
          photoOnLeft ? "md:order-2" : "md:order-1"
        }`}
      >
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted dark:text-muted-dark">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h2
          className="!text-primary dark:!text-primary-dark"
          style={{ fontFamily: "Vectra", fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 1.15, paddingTop: 4 }}
        >
          {photo.title}
        </h2>
        {photo.description && (
          <p className="text-sm md:text-base text-light-foreground/85 dark:text-dark-foreground/85 leading-relaxed whitespace-pre-line">
            {photo.description}
          </p>
        )}
        <PhotoMeta camera={photo.camera} date={date} />
      </aside>
    </section>
  );
}

function PhotoMeta({ camera, date }: { camera: string | null; date: string | null }) {
  if (!camera && !date) return null;
  return (
    <footer className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-black/10 dark:border-white/10 text-xs text-muted dark:text-muted-dark">
      {camera && (
        <span className="flex items-center gap-2 text-muted dark:text-muted-dark">
          <CameraIcon size={12} weight="bold" />
          {camera}
        </span>
      )}
      {date && (
        <span className="flex items-center gap-2 text-muted dark:text-muted-dark">
          <CalendarIcon size={12} weight="bold" />
          {date}
        </span>
      )}
    </footer>
  );
}
