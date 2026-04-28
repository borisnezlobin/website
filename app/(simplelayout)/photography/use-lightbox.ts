"use client";

import { useCallback, useEffect, useState } from "react";

export type LightboxState = {
  index: number;
  open: () => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setIndex: (i: number) => void;
  isOpen: boolean;
};

export function useLightbox(total: number, initialIndex = -1): LightboxState {
  const [index, setIndex] = useState(initialIndex);

  const next = useCallback(() => {
    setIndex((i) => (total > 0 && i >= 0 ? (i + 1) % total : i));
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (total > 0 && i >= 0 ? (i - 1 + total) % total : i));
  }, [total]);

  const close = useCallback(() => setIndex(-1), []);
  const open = useCallback(() => setIndex((i) => (i < 0 ? 0 : i)), []);

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, next, prev]);

  useEffect(() => {
    if (index < 0) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [index]);

  return { index, open, close, next, prev, setIndex, isOpen: index >= 0 };
}
