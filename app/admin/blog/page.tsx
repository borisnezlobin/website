"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FloppyDisk, Eye, CaretRight } from "@phosphor-icons/react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  description: string;
  remoteURL: string | null;
  createdAt: string;
};

export default function BlogAdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [content, setContent] = useState("");
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
    if (isAuthed) {
      fetchPosts();
    }
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

  async function selectPost(post: BlogPost) {
    setSelectedPost(post);
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
        body: JSON.stringify({ slug: selectedPost.slug, content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Saved to ${data.blobUrl}` });
        fetchPosts();
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
              href={`/blog/${selectedPost.slug}`}
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
            <div
              className={`mb-4 p-3 rounded text-sm ${
                message.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="text-sm text-muted mb-2">
            {selectedPost.remoteURL ? (
              <span>Remote: {selectedPost.remoteURL}</span>
            ) : (
              <span>No remote URL (will be created on save)</span>
            )}
          </div>

          {loading ? (
            <div className="text-muted">Loading content...</div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100vh-280px)] p-4 font-mono text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
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
                  <div className="font-medium truncate">{post.title}</div>
                  <div className="text-sm text-muted truncate">{post.description}</div>
                  <div className="text-xs text-muted mt-1">
                    {post.remoteURL ? "Remote" : "Local"} · {new Date(post.createdAt).toLocaleDateString()}
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
