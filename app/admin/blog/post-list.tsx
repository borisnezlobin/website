"use client";

import { useEffect, useState } from "react";
import { Eye, EyeSlash, CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { isViewExcluded, setViewExcluded } from "@/app/lib/view-exclude-client";
import type { Post } from "./lib/types";

const CATEGORY_BADGES: Partial<Record<Post["category"], { label: string; className: string }>> = {
  CREATIVE: { label: "Creative", className: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  PERSONAL: { label: "Personal", className: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300" },
};

function ViewCountingToggle() {
  const [excluded, setExcluded] = useState(false);

  useEffect(() => {
    setExcluded(isViewExcluded());
  }, []);

  function toggleExcluded() {
    const next = !excluded;
    setViewExcluded(next);
    setExcluded(next);
  }

  return (
    <button
      onClick={toggleExcluded}
      title={excluded ? "Your views on this device are not counted" : "Count your views on this device"}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
        excluded
          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
          : "text-muted hover:text-black dark:hover:text-white"
      }`}
    >
      {excluded ? <EyeSlash size={18} /> : <Eye size={18} />}
      {excluded ? "Not counting you" : "Counting you"}
    </button>
  );
}

function PostRow({ post, onSelect }: { post: Post; onSelect: (post: Post) => void }) {
  const badge = CATEGORY_BADGES[post.category];
  return (
    <button
      onClick={() => onSelect(post)}
      className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{post.title}</span>
          {post.isDraft && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex-shrink-0">Draft</span>}
          {badge && <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${badge.className}`}>{badge.label}</span>}
        </div>
        <div className="text-sm text-muted truncate">{post.description}</div>
        <div className="text-xs text-muted mt-1">
          {new Date(post.createdAt).toLocaleDateString()} · {post.views} view{post.views !== 1 && "s"}
        </div>
      </div>
      <CaretRight size={20} className="text-muted flex-shrink-0" />
    </button>
  );
}

export function PostList({
  posts,
  loading,
  onSelect,
  onNew,
}: {
  posts: Post[];
  loading: boolean;
  onSelect: (post: Post) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Posts</h1>
          <div className="flex items-center gap-4">
            <ViewCountingToggle />
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} weight="bold" />
              New article
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Loading posts...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
