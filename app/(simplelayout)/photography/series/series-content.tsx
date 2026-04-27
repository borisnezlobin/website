"use client";

import { useState } from "react";
import type { Photo, Series } from "@/app/lib/photo-types";
import PhotoFullscreen from "./photo-fullscreen";
import SeriesIntro from "./series-intro";
import SeriesSection from "./series-section";

export default function SeriesContent({ series }: { series: Series }) {
  const [fullscreen, setFullscreen] = useState<Photo | null>(null);

  return (
    <>
      <main
        className="fixed inset-0 overflow-y-auto overscroll-y-contain bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <SeriesIntro
          title={series.title}
          description={series.description}
          count={series.photos.length}
        />
        {series.photos.map((photo, i) => (
          <SeriesSection
            key={photo.id}
            photo={photo}
            index={i}
            total={series.photos.length}
            onOpenFullscreen={setFullscreen}
          />
        ))}
      </main>
      {fullscreen && (
        <PhotoFullscreen
          src={fullscreen.image}
          alt={fullscreen.title}
          onClose={() => setFullscreen(null)}
        />
      )}
    </>
  );
}
