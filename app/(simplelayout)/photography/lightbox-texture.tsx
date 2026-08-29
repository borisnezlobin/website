"use client";

import { useEffect, useRef } from "react";
import { createSpinDrive, type Mask } from "@/app/lib/spin-drive";

// Rises from the bottom of its block and thins to nothing at the top, leaning
// left. It fills whatever space the caption leaves, so it fades in rather than
// starting at a hard edge under the text.
const infoPanelMask: Mask = (x, y, w, h) => {
  const u = x / w;
  const v = y / h;
  const rise = Math.max(0, Math.min(1, (v - 0.08) / 0.6));
  const lean = 1 - u * 0.45;
  const wob = Math.sin(x * 0.03 + y * 0.02) * 0.12;
  return Math.max(0, Math.min(1, rise * lean * 0.78 + wob * rise));
};

// Desktop-only ornament for the enlarged view — the lightbox is always on a dark
// scrim, so the palette is pinned to dark rather than tracking the page theme.
// h-full/w-full rather than insets alone: the global reset puts height:auto on
// canvas, which collapses an absolutely positioned one to its intrinsic 300x150.
export default function LightboxTexture() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return createSpinDrive(ref.current, infoPanelMask, {
      cell: 15,
      intensity: 1.15,
      theme: "dark",
    });
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full hidden md:block"
    />
  );
}
