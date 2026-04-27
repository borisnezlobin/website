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
      className={`print:hidden fixed flex bottom-4 z-30 left-4 flex-row items-center justify-center gap-4 border border-muted dark:border-muted-dark p-4 md:p-2 md:px-6 rounded-full shadow-lg bg-light-background dark:bg-dark-background ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUpIcon className="w-6 h-6 text-muted dark:text-muted-dark transition duration-100" />
    </button>
  );
}
