import type { ArticleCategory } from "@/prisma/awooga/client";
import { readJsonResponse } from "./read-json-response";
import type { AdminFetch, Post } from "./types";

export type ArticleFields = {
  content: string;
  description: string;
  category: ArticleCategory;
  isDraft: boolean;
};

type SaveResponse = {
  success?: boolean;
  blobUrl: string;
  isDraft: boolean;
  category: ArticleCategory;
  description?: string;
  draftUid: string | null;
};

type CreateResponse = { success?: boolean; post: Post; blobUrl: string | null };

async function send<T extends { success?: boolean }>(
  adminFetch: AdminFetch,
  method: "POST" | "PUT",
  body: object,
  fallbackError: string,
): Promise<T> {
  const res = await adminFetch("/api/admin/blog", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJsonResponse<T>(res);
  if (!data.success) throw new Error(data.error || fallbackError);
  return data;
}

export async function saveArticle(adminFetch: AdminFetch, post: Post, fields: ArticleFields) {
  const data = await send<SaveResponse>(adminFetch, "POST", { slug: post.slug, ...fields }, "Failed to save");
  const saved: Post = {
    ...post,
    isDraft: data.isDraft,
    category: data.category,
    description: data.description ?? fields.description,
    draftUid: data.draftUid,
  };
  return { post: saved, message: `Saved to ${data.blobUrl}` };
}

export async function createArticle(
  adminFetch: AdminFetch,
  identity: { title: string; slug: string },
  fields: ArticleFields,
) {
  const data = await send<CreateResponse>(adminFetch, "PUT", { ...identity, ...fields }, "Failed to create");
  return { post: data.post, message: data.blobUrl ? `Created · ${data.blobUrl}` : "Created" };
}

export async function loadArticle(adminFetch: AdminFetch, slug: string) {
  const res = await adminFetch(`/api/admin/blog?slug=${slug}`);
  const data = await res.json();
  return { content: (data.content as string) || "", viewsByDay: data.viewsByDay || [] };
}
