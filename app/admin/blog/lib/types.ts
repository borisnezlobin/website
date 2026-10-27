import type { ArticleCategory } from "@/prisma/awooga/client";

export type Post = {
  id: string;
  title: string;
  slug: string;
  description: string;
  remoteURL: string | null;
  createdAt: string;
  views: number;
  isDraft: boolean;
  category: ArticleCategory;
  draftUid: string | null;
};

export type AdminFetch = (path: string, init?: RequestInit) => Promise<Response>;

export type EditorMessage = { type: "success" | "error"; text: string };
