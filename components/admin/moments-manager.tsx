"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AdminMoment } from "@/lib/moments";
import CoverUploader from "@/components/admin/cover-uploader";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 说说管理：列表 + 新增 + 内联编辑/删除 */
export default function MomentsManager() {
  const [moments, setMoments] = useState<AdminMoment[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增表单
  const [newDate, setNewDate] = useState(today());
  const [newContent, setNewContent] = useState("");
  const [newCover, setNewCover] = useState("");
  const [creating, setCreating] = useState(false);

  // 内联编辑
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingCover, setEditingCover] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/moments");
      if (res.ok) {
        setMoments(await res.json());
      }
    } catch {
      // 忽略加载失败，保持旧数据
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, content: newContent, cover: newCover }),
      });
      if (res.ok) {
        setNewContent("");
        setNewDate(today());
        setNewCover("");
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "发布失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(moment: AdminMoment) {
    setEditingId(moment.id);
    setEditingDate(moment.date);
    setEditingContent(moment.content);
    setEditingCover(moment.cover);
    setError("");
  }

  async function handleUpdate(id: number) {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/moments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: editingDate, content: editingContent, cover: editingCover }),
      });
      if (res.ok) {
        setEditingId(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "保存失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除这条说说？")) return;
    await fetch(`/api/admin/moments/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return <p className="glass rounded-2xl p-8 text-center text-gray-500">加载中…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 新增说说 */}
      <form
        onSubmit={handleCreate}
        className="glass flex flex-col gap-3 rounded-2xl p-5"
      >
        <h2 className="font-bold text-gray-200">发布新说说</h2>
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          required
          className={inputClass}
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={3}
          required
          placeholder="今天想说点什么？（支持 Markdown）"
          className={inputClass}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-gray-400">封面（可不上传）</span>
          <CoverUploader cover={newCover} onCoverChange={setNewCover} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="self-start rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
        >
          {creating ? "发布中…" : "发布"}
        </button>
      </form>

      {/* 已有说说 */}
      {moments.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-gray-500">
          还没有说说，发一条吧
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {moments.map((moment) => (
            <li key={moment.id} className="glass rounded-2xl p-5">
              {editingId === moment.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-gray-400">封面</span>
                    <CoverUploader cover={editingCover} onCoverChange={setEditingCover} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingId === moment.id}
                      onClick={() => handleUpdate(moment.id)}
                      className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
                    >
                      {savingId === moment.id ? "保存中…" : "保存"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {moment.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={moment.cover}
                      alt=""
                      className="mb-3 h-32 w-full rounded-xl object-cover"
                    />
                  )}
                  <p className="text-sm font-medium text-gray-500">
                    {moment.date}
                  </p>
                  <div className="mt-2 text-gray-300">
                    <ReactMarkdown>{moment.content}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(moment)}
                      className="rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(moment.id)}
                      className="rounded-full px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      删除
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
