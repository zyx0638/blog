"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AdminPost } from "@/lib/posts";
import CoverUploader from "@/components/admin/cover-uploader";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 文章编辑器：新建（无 slug）或编辑（传 slug） */
export default function PostEditor({ slug }: { slug?: string }) {
  const isEditing = Boolean(slug);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [date, setDate] = useState(today());
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [published, setPublished] = useState(true);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 编辑模式：挂载时拉取文章数据
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/admin/posts/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((post: AdminPost) => {
        setTitle(post.title);
        setPostSlug(post.slug);
        setDate(post.date);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCover(post.cover);
        setPublished(post.published);
      })
      .catch(() => setError("文章加载失败"))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        isEditing ? `/api/admin/posts/${slug}` : "/api/admin/posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            date,
            excerpt,
            content,
            cover,
            published,
          }),
        }
      );
      if (res.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "保存失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="glass rounded-2xl p-8 text-center text-gray-500">加载中…</p>;
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-1">
          <span className="text-sm text-gray-400">标题</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="文章标题"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-gray-400">日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        {isEditing && (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-gray-400">slug（网址后缀，创建后不可修改）</span>
            <input
              type="text"
              value={postSlug}
              disabled
              className={`${inputClass} disabled:opacity-50`}
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">摘要（列表页显示）</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="一句话介绍这篇文章"
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">封面（列表卡片顶部显示，可不上传）</span>
        <CoverUploader cover={cover} onCoverChange={setCover} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-sm text-gray-400">
          <span>正文（Markdown）</span>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="rounded-full px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-white/10"
          >
            {preview ? "返回编辑" : "预览"}
          </button>
        </span>
        {preview ? (
          <div className="prose max-w-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 prose-invert prose-a:text-gray-200">
            <ReactMarkdown>{content || "*（暂无内容）*"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder={"支持 Markdown：\n## 标题\n**加粗** `代码` 等"}
            className={`${inputClass} font-mono text-sm leading-relaxed`}
          />
        )}
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-white"
        />
        发布（不勾选则保存为草稿，前台不可见）
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-full px-5 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          取消
        </button>
      </div>
    </form>
  );
}
