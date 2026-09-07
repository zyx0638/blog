"use client";

import { useRef, useState } from "react";

/**
 * 封面上传控件：预览 + 上传 + 更换/移除，供文章与碎碎念编辑器复用。
 * 上传走通用接口 /api/admin/upload，返回 /uploads/ 路径由 onCoverChange 回调给父组件。
 */
export default function CoverUploader({
  cover,
  onCoverChange,
}: {
  cover: string;
  onCoverChange: (src: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 清空，允许再次选择同一文件
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        onCoverChange(data.src);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "上传失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {cover ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt="封面预览"
            className="h-20 w-32 rounded-lg border border-white/10 object-cover"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full px-4 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {uploading ? "上传中…" : "更换封面"}
            </button>
            <button
              type="button"
              onClick={() => onCoverChange("")}
              disabled={uploading}
              className="rounded-full px-4 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              移除封面
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="self-start rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {uploading ? "上传中…" : "上传封面"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
