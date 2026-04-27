"use client";

import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

export default function LightboxControls({
  onClose,
  onNext,
  onPrev,
}: {
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Previous photo"
      >
        <CaretLeftIcon size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Next photo"
      >
        <CaretRightIcon size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-3 top-3 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Close"
      >
        <XIcon size={22} />
      </button>
    </>
  );
}
