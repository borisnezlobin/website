"use client";

import { useEffect, useState } from "react";
import type { ArticleCategory } from "@/prisma/awooga/client";
import ViewsChart, { type ViewDay } from "./views-chart";
import { useAdminAuth } from "../components/admin-auth";
import { createArticle, loadArticle, saveArticle } from "./lib/article-requests";
import { useInlineImageUploads } from "./lib/use-inline-image-uploads";
import type { EditorMessage, Post } from "./lib/types";
import {
  ContentField,
  DescriptionField,
  EditorHeader,
  NewArticleFields,
  PublishToggles,
  StatusMessage,
  previewHrefFor,
  type NewArticleIdentity,
} from "./editor-parts";

export function ArticleEditor({
  initialPost,
  onBack,
  onPostSaved,
}: {
  initialPost: Post | null;
  onBack: () => void;
  onPostSaved: (post: Post, isNew: boolean) => void;
}) {
  const { adminFetch } = useAdminAuth();
  const [post, setPost] = useState(initialPost);
  const [content, setContent] = useState("");
  const [viewsByDay, setViewsByDay] = useState<ViewDay[]>([]);
  const [description, setDescription] = useState(initialPost?.description ?? "");
  const [isDraft, setIsDraft] = useState(initialPost?.isDraft ?? false);
  const [category, setCategory] = useState<ArticleCategory>(initialPost?.category ?? "TECHNICAL");
  const [identity, setIdentity] = useState<NewArticleIdentity>({ title: "", slug: "", slugEdited: false });
  const [loading, setLoading] = useState(initialPost !== null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const images = useInlineImageUploads(adminFetch, setContent);

  useEffect(() => {
    if (!initialPost) return;
    loadArticle(adminFetch, initialPost.slug)
      .then((loaded) => {
        setContent(images.absorb(loaded.content));
        setViewsByDay(loaded.viewsByDay);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!post && (!identity.title.trim() || !identity.slug.trim())) {
      setMessage({ type: "error", text: "Title and slug are required" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const html = await images.finalize(content);
      setContent(html);
      const fields = { content: html, description, category, isDraft };
      const result = post
        ? await saveArticle(adminFetch, post, fields)
        : await createArticle(adminFetch, { title: identity.title.trim(), slug: identity.slug.trim() }, fields);
      setPost(result.post);
      onPostSaved(result.post, !post);
      setMessage({ type: "success", text: result.message });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto">
        <EditorHeader
          title={post?.title ?? "New article"}
          previewHref={post && previewHrefFor(post)}
          saving={saving}
          progress={images.progress}
          onBack={onBack}
          onSubmit={submit}
        />
        {message && <StatusMessage message={message} />}
        {!post && <NewArticleFields identity={identity} onChange={setIdentity} />}
        {post && <ViewsChart viewsByDay={viewsByDay} totalViews={post.views} />}
        <DescriptionField value={description} onChange={setDescription} />
        <PublishToggles
          post={post}
          isDraft={isDraft}
          onDraftChange={setIsDraft}
          category={category}
          onCategoryChange={setCategory}
        />
        {loading ? (
          <div className="text-muted">Loading content...</div>
        ) : (
          <ContentField value={content} onChange={setContent} absorbInlineImages={images.absorb} />
        )}
      </div>
    </div>
  );
}
