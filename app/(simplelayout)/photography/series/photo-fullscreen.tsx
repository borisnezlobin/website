"use client";

import { useEffect } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

export default function PhotoFullscreen({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-3 top-3 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Close"
      >
        <XIcon size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[95vh] object-contain rounded shadow-2xl"
      />
    </div>
  );
}
