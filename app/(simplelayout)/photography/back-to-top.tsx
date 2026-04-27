"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/ssr";

const SHOW_AFTER_PX = 600;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-5 right-4 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md bg-light-background/85 dark:bg-dark-background/80 border border-black/10 dark:border-white/10 shadow-lg text-[11px] font-medium uppercase tracking-widest text-light-foreground dark:text-dark-foreground transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUpIcon size={12} weight="bold" />
      Top
    </button>
  );
}
