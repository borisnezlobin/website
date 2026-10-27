"use client";

import { ArrowLeft, FloppyDisk, Eye } from "@phosphor-icons/react/dist/ssr";
import type { ArticleCategory } from "@/prisma/awooga/client";
import type { EditorMessage, Post } from "./lib/types";
import type { UploadProgress } from "./lib/use-inline-image-uploads";

const CATEGORIES: ArticleCategory[] = ["TECHNICAL", "CREATIVE", "PERSONAL"];
const titleCase = (c: ArticleCategory) => c[0] + c.slice(1).toLowerCase();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const fieldClass =
  "w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400 text-sm";

export type NewArticleIdentity = { title: string; slug: string; slugEdited: boolean };

export function previewHrefFor(post: Post): string {
  return post.isDraft && post.draftUid ? `/blog/${post.slug}-${post.draftUid}` : `/blog/${post.slug}`;
}

function submitLabel(editing: boolean, saving: boolean): string {
  if (saving) return editing ? "Saving..." : "Creating...";
  return editing ? "Save" : "Create";
}

export function EditorHeader({
  title,
  previewHref,
  saving,
  progress,
  onBack,
  onSubmit,
}: {
  title: string;
  previewHref: string | null;
  saving: boolean;
  progress: UploadProgress;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted hover:text-black dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>
      <h1 className="text-xl font-semibold flex-1">{title}</h1>
      <UploadStatus progress={progress} />
      {previewHref && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-black dark:hover:text-white transition-colors"
        >
          <Eye size={18} />
          Preview
        </a>
      )}
      <button
        onClick={onSubmit}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <FloppyDisk size={18} />
        {submitLabel(previewHref !== null, saving)}
      </button>
    </div>
  );
}

function UploadStatus({ progress }: { progress: UploadProgress }) {
  const pending = progress.total - progress.uploaded - progress.failed;
  if (pending > 0) {
    return (
      <span className="text-sm text-muted tabular-nums" role="status">
        Uploading images: {progress.uploaded} of {progress.total}
      </span>
    );
  }
  if (progress.failed > 0) {
    return (
      <span className="text-sm text-red-700 dark:text-red-300" role="status">
        {progress.failed} image{progress.failed === 1 ? "" : "s"} didn&rsquo;t upload. Saving retries them.
      </span>
    );
  }
  return null;
}

export function StatusMessage({ message }: { message: EditorMessage }) {
  const tone =
    message.type === "success"
      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
  return <div className={`mb-4 p-3 rounded text-sm ${tone}`}>{message.text}</div>;
}

export function NewArticleFields({
  identity,
  onChange,
}: {
  identity: NewArticleIdentity;
  onChange: (identity: NewArticleIdentity) => void;
}) {
  const setTitle = (title: string) =>
    onChange({ ...identity, title, slug: identity.slugEdited ? identity.slug : slugify(title) });
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm text-muted dark:text-muted-dark">Title</label>
        <input
          value={identity.title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
          placeholder="Article title"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm text-muted dark:text-muted-dark">Slug</label>
        <input
          value={identity.slug}
          onChange={(e) => onChange({ ...identity, slug: e.target.value, slugEdited: true })}
          className={`${fieldClass} font-mono`}
          placeholder="article-slug"
        />
        <span className="text-xs text-muted">/writing/{identity.slug || "…"}</span>
      </div>
    </div>
  );
}

export function DescriptionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-sm text-muted dark:text-muted-dark">Description</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`${fieldClass} resize-none`}
        placeholder="One-line summary shown on the blog index and in social previews."
      />
    </div>
  );
}

function ToggleButton({
  selected,
  selectedClass,
  onClick,
  children,
}: {
  selected: boolean;
  selectedClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        selected ? selectedClass : "text-muted hover:text-black dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

const NEUTRAL_SELECTED = "bg-neutral-900 dark:bg-white text-white dark:text-black";
const DRAFT_SELECTED = "bg-amber-600 dark:bg-amber-500 text-white dark:text-black";

function DraftUrlNote({ post }: { post: Post | null }) {
  if (!post?.isDraft) return null;
  if (!post.draftUid) return <span className="text-xs text-muted italic">UID generated on first save</span>;
  return (
    <span className="text-xs text-muted font-mono">
      draft URL: /blog/{post.slug}-{post.draftUid}
    </span>
  );
}

export function PublishToggles({
  post,
  isDraft,
  onDraftChange,
  category,
  onCategoryChange,
}: {
  post: Post | null;
  isDraft: boolean;
  onDraftChange: (isDraft: boolean) => void;
  category: ArticleCategory;
  onCategoryChange: (category: ArticleCategory) => void;
}) {
  return (
    <div className="flex items-center gap-6 mb-4">
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        <ToggleButton selected={!isDraft} selectedClass={NEUTRAL_SELECTED} onClick={() => onDraftChange(false)}>
          Published
        </ToggleButton>
        <ToggleButton selected={isDraft} selectedClass={DRAFT_SELECTED} onClick={() => onDraftChange(true)}>
          Draft
        </ToggleButton>
      </div>
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        {CATEGORIES.map((c) => (
          <ToggleButton key={c} selected={category === c} selectedClass={NEUTRAL_SELECTED} onClick={() => onCategoryChange(c)}>
            {titleCase(c)}
          </ToggleButton>
        ))}
      </div>
      <DraftUrlNote post={post} />
    </div>
  );
}

// A pasted Gasp export can be ~100 MB of base64 images. Letting the browser
// insert that into the textarea alone stalls the tab for many seconds, so the
// paste is intercepted and only the image-free text is spliced in.
function pasteWithoutInlineImages(
  event: React.ClipboardEvent<HTMLTextAreaElement>,
  absorbInlineImages: (html: string) => string,
): string | null {
  const pasted = event.clipboardData.getData("text/plain");
  if (!pasted.includes("data:image/")) return null;
  event.preventDefault();
  const textarea = event.currentTarget;
  const inserted = absorbInlineImages(pasted);
  const caret = textarea.selectionStart + inserted.length;
  requestAnimationFrame(() => textarea.setSelectionRange(caret, caret));
  return textarea.value.slice(0, textarea.selectionStart) + inserted + textarea.value.slice(textarea.selectionEnd);
}

export function ContentField({
  value,
  onChange,
  absorbInlineImages,
}: {
  value: string;
  onChange: (value: string) => void;
  absorbInlineImages: (html: string) => string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(absorbInlineImages(e.target.value))}
      onPaste={(e) => {
        const next = pasteWithoutInlineImages(e, absorbInlineImages);
        if (next !== null) onChange(next);
      }}
      className="w-full h-[calc(100vh-320px)] p-4 font-mono text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
      placeholder="Enter HTML content..."
      spellCheck={false}
    />
  );
}
