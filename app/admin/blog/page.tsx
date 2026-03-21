"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FloppyDisk, Eye, CaretRight } from "@phosphor-icons/react/dist/ssr";

type Post = {
  id: string;
  title: string;
  slug: string;
  description: string;
  remoteURL: string | null;
  createdAt: string;
  views: number;
  isDraft: boolean;
  isCreative: boolean;
  draftUid: string | null;
};

export default function BlogAdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [isCreative, setIsCreative] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin_password");
    if (stored) {
      setPassword(stored);
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) fetchPosts();
  }, [isAuthed]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) {
        setIsAuthed(false);
        localStorage.removeItem("admin_password");
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function selectPost(post: Post) {
    setSelectedPost(post);
    setIsDraft(post.isDraft);
    setIsCreative(post.isCreative);
    setContent("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog?slug=${post.slug}`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      setContent(data.content || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveContent() {
    if (!selectedPost) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ slug: selectedPost.slug, content, isDraft, isCreative }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedPost: Post = {
          ...selectedPost,
          isDraft: data.isDraft,
          isCreative: data.isCreative,
          draftUid: data.draftUid,
        };
        setSelectedPost(updatedPost);
        setPosts(prev => prev.map(p => p.slug === updatedPost.slug ? updatedPost : p));
        setMessage({ type: "success", text: `Saved to ${data.blobUrl}` });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("admin_password", password);
    setIsAuthed(true);
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-80">
          <h1 className="text-xl font-semibold text-center">Blog Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (selectedPost) {
    const previewHref = selectedPost.isDraft && selectedPost.draftUid
      ? `/blog/${selectedPost.slug}-${selectedPost.draftUid}`
      : `/blog/${selectedPost.slug}`;

    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-muted hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-xl font-semibold flex-1">{selectedPost.title}</h1>
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-black dark:hover:text-white transition-colors"
            >
              <Eye size={18} />
              Preview
            </a>
            <button
              onClick={saveContent}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <FloppyDisk size={18} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${message.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"}`}>
              {message.text}
            </div>
          )}

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 dark:accent-white"
              />
              <span className="text-sm">Draft</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCreative}
                onChange={(e) => setIsCreative(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 dark:accent-white"
              />
              <span className="text-sm">Creative</span>
            </label>
            {selectedPost.isDraft && selectedPost.draftUid && (
              <span className="text-xs text-muted font-mono">
                draft URL: /blog/{selectedPost.slug}-{selectedPost.draftUid}
              </span>
            )}
            {selectedPost.isDraft && !selectedPost.draftUid && (
              <span className="text-xs text-muted italic">UID generated on first save</span>
            )}
          </div>

          {loading ? (
            <div className="text-muted">Loading content...</div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100vh-320px)] p-4 font-mono text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Enter HTML content..."
              spellCheck={false}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Blog Admin</h1>
          <button
            onClick={() => {
              localStorage.removeItem("admin_password");
              setIsAuthed(false);
              setPassword("");
            }}
            className="text-sm text-muted hover:text-black dark:hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        {loading ? (
          <div className="text-muted">Loading posts...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => selectPost(post)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{post.title}</span>
                    {post.isDraft && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex-shrink-0">Draft</span>}
                    {post.isCreative && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex-shrink-0">Creative</span>}
                  </div>
                  <div className="text-sm text-muted truncate">{post.description}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(post.createdAt).toLocaleDateString()} · {post.views} view{post.views !== 1 && "s"}
                  </div>
                </div>
                <CaretRight size={20} className="text-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
