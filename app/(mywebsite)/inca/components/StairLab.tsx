"use client";

import { useState } from "react";
import { StairWireframe } from "./StairWireframe";
import { photoUrl } from "../lib/photos";
import type { StairMesh } from "../lib/stairs";

export interface StairItem {
  photo: string;
  caption: string;
  mesh: StairMesh;
  traced: boolean;
}

// Each photographed flight, paired with its spinnable 3D wireframe — either a
// hand-traced model or, until one exists, a procedural stand-in. Tap a thumbnail
// to load a different staircase into the viewer.

export function StairLab({ items }: { items: StairItem[] }) {
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <figure className="m-0">
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(current.photo)}
              alt={current.caption}
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
            />
          </div>
          <figcaption className="mt-2 text-xs text-muted dark:text-muted-dark">the photo</figcaption>
        </figure>

        <figure className="m-0">
          <StairWireframe mesh={current.mesh} label={current.caption} />
          <figcaption className="mt-2 text-xs text-muted dark:text-muted-dark">
            its wireframe — {current.traced ? "hand-traced" : "procedural stand-in"}
          </figcaption>
        </figure>
      </div>

      <p className="mx-auto mt-4 max-w-2xl text-light-foreground dark:text-dark-foreground">{current.caption}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((s, i) => (
          <button
            key={s.photo}
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
            <img src={photoUrl(s.photo)} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
