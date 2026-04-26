"use client";

import { ShuffleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@/app/lib/photo-types";

export default function CategoryChips({
  categories,
  activeSlug,
  onPick,
  onScramble,
}: {
  categories: Category[];
  activeSlug: string | null;
  onPick: (cat: Category) => void;
  onScramble: () => void;
}) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-4 py-3 w-max">
        <button
          onClick={onScramble}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 text-white/80 hover:border-white/40 transition-colors flex-shrink-0"
        >
          <ShuffleIcon size={12} weight="bold" />
          Scramble
        </button>
        {categories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <button
              key={cat.id}
              onClick={() => onPick(cat)}
              disabled={cat.count === 0}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-30 ${
                active
                  ? "bg-white text-black"
                  : "bg-transparent text-white/80 border border-white/15 hover:border-white/40"
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 ${active ? "text-black/40" : "text-white/40"}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
