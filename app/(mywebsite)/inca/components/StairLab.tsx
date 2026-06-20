"use client";

import { useState } from "react";
import { StairWireframe } from "./StairWireframe";
import { photoUrl, type StaircasePhoto } from "../lib/photos";

// Each photographed flight, paired with its spinnable wireframe reconstruction.
// Tap a thumbnail to switch which staircase is loaded into the viewer.

export function StairLab({ staircases }: { staircases: StaircasePhoto[] }) {
  const [active, setActive] = useState(0);
  const current = staircases[active];

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <figure className="m-0">
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(current.file)}
              alt={current.caption}
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
            />
          </div>
          <figcaption className="mt-2 text-xs text-muted dark:text-muted-dark">the photo</figcaption>
        </figure>

        <figure className="m-0">
          <StairWireframe spec={current.spec} label={current.caption} />
          <figcaption className="mt-2 text-xs text-muted dark:text-muted-dark">
            its wireframe — {current.spec.steps} steps, reconstructed
          </figcaption>
        </figure>
      </div>

      <p className="mt-4 max-w-2xl text-light-foreground dark:text-dark-foreground">{current.caption}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {staircases.map((s, i) => (
          <button
            key={s.file}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`Show staircase ${i + 1}`}
            className={`h-16 w-14 shrink-0 overflow-hidden rounded-md border-2 transition ${
              i === active
                ? "border-[color:var(--primary)]"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(s.file)} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
