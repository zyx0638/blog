"use client";

import { useEffect, useState } from "react";
import CoverUploader from "@/components/admin/cover-uploader";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none";

/** 「关于」页管理：头像 + ID + 简介（Markdown），单行数据，保存即生效 */
export default function AboutManager() {
  const [avatar, setAvatar] = useState("");
  const [handle, setHandle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // 挂载时拉取当前关于页信息
  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: { avatar: string; handle: string; content: string }) => {
        setAvatar(data.avatar ?? "");
        setHandle(data.handle ?? "");
        setContent(data.content ?? "");
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, handle, content }),
      });
      if (res.ok) {
        setSaved(true);
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
    <form onSubmit={handleSave} className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">头像（展示在关于页，可不上传）</span>
        <CoverUploader cover={avatar} onCoverChange={setAvatar} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">ID（展示在头像右侧，如昵称/账号名）</span>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="如 zyx0638"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">简介（Markdown）</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder={"支持 Markdown：\n## 关于我\n你好，我是…"}
          className={`${inputClass} font-mono text-sm leading-relaxed`}
        />
      </label>

      {saved && <p className="text-sm text-green-400">已保存</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
