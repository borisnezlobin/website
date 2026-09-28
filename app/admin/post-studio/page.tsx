"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "../components/admin-auth";
import { PostStudio, type StudioArticle } from "./post-studio";

type AdminPost = StudioArticle & { isDraft: boolean };

function toStudioArticle({ title, description, category, slug }: AdminPost): StudioArticle {
  return { title, description, category, slug };
}

export default function PostStudioPage() {
  const { adminFetch } = useAdminAuth();
  const [articles, setArticles] = useState<StudioArticle[] | null>(null);

  useEffect(() => {
    async function loadArticles() {
      const res = await adminFetch("/api/admin/blog");
      if (!res.ok) return;
      const { posts } = (await res.json()) as { posts: AdminPost[] };
      setArticles(posts.filter((post) => !post.isDraft).map(toStudioArticle));
    }
    loadArticles().catch(console.error);
  }, [adminFetch]);

  if (!articles) return null;
  return <PostStudio articles={articles} />;
}
