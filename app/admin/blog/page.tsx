"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../components/admin-auth";
import { ArticleEditor } from "./article-editor";
import { PostList } from "./post-list";
import type { Post } from "./lib/types";

type EditorTarget = { post: Post | null } | null;

export default function BlogAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/blog");
      if (res.status === 401) return;
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function recordSavedPost(post: Post, isNew: boolean) {
    setPosts((prev) => (isNew ? [post, ...prev] : prev.map((p) => (p.slug === post.slug ? post : p))));
  }

  if (editorTarget) {
    return (
      <ArticleEditor
        initialPost={editorTarget.post}
        onBack={() => setEditorTarget(null)}
        onPostSaved={recordSavedPost}
      />
    );
  }

  return (
    <PostList
      posts={posts}
      loading={loading}
      onSelect={(post) => setEditorTarget({ post })}
      onNew={() => setEditorTarget({ post: null })}
    />
  );
}
