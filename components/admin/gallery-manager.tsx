"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminPhotoGroup } from "@/lib/gallery";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none";

/** 照片墙管理：图片组列表 + 组内图片上传/外链添加 + 内联编辑/删除 */
export default function GalleryManager() {
  const [groups, setGroups] = useState<AdminPhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 新建组表单
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // 手风琴展开（一次展开一组）
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 内联编辑组
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  // 图片表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [urlSrc, setUrlSrc] = useState("");
  const [urlCaption, setUrlCaption] = useState("");
  const [busyPhotoGroupId, setBusyPhotoGroupId] = useState<number | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/gallery");
      if (res.ok) {
        setGroups(await res.json());
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

  function toggleExpand(id: number) {
    setExpandedId((cur) => (cur === id ? null : id));
    setError("");
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (res.ok) {
        const group = await res.json();
        setNewTitle("");
        setNewDescription("");
        await load();
        setExpandedId(group.id); // 新组自动展开，方便直接传图
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "创建失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setCreating(false);
    }
  }

  function startEditGroup(group: AdminPhotoGroup) {
    setEditingId(group.id);
    setEditTitle(group.title);
    setEditDescription(group.description);
    setError("");
  }

  async function handleUpdateGroup(id: number) {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
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

  async function handleDeleteGroup(id: number) {
    if (!window.confirm("确认删除这个图片组？组内照片和已上传文件会一并删除。")) return;
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "删除失败");
      return;
    }
    if (expandedId === id) setExpandedId(null);
    await load();
  }

  /** 上传文件成功后立刻添加进组，一次点击完成"上传并添加" */
  async function handleUploadAndAdd(groupId: number) {
    if (!uploadFile) {
      setError("请选择图片");
      return;
    }
    setBusyPhotoGroupId(groupId);
    setError("");
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      const uploadRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        setError(data.error ?? "上传失败");
        return;
      }
      const { src } = await uploadRes.json();

      const addRes = await fetch(`/api/admin/gallery/${groupId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src, caption: uploadCaption }),
      });
      if (!addRes.ok) {
        const data = await addRes.json().catch(() => ({}));
        setError(data.error ?? "添加失败");
        return;
      }
      setUploadFile(null);
      setUploadCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusyPhotoGroupId(null);
    }
  }

  async function handleAddUrl(groupId: number) {
    setBusyPhotoGroupId(groupId);
    setError("");
    try {
      const res = await fetch(`/api/admin/gallery/${groupId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src: urlSrc, caption: urlCaption }),
      });
      if (res.ok) {
        setUrlSrc("");
        setUrlCaption("");
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "添加失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusyPhotoGroupId(null);
    }
  }

  async function handleDeletePhoto(photoId: number) {
    if (!window.confirm("确认删除这张照片？")) return;
    setDeletingPhotoId(photoId);
    setError("");
    try {
      const res = await fetch(`/api/admin/gallery/photos/${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "删除失败");
        return;
      }
      await load();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  if (loading) {
    return (
      <p className="glass rounded-2xl p-8 text-center text-gray-500">加载中…</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 新建图片组 */}
      <form
        onSubmit={handleCreateGroup}
        className="glass flex flex-col gap-3 rounded-2xl p-5"
      >
        <h2 className="font-bold text-orange-400">新建图片组</h2>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
          placeholder="组标题，如：2026 年夏天的旅行"
          className={inputClass}
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          rows={2}
          placeholder="组描述（可选）"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="self-start rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-black shadow-md shadow-orange-500/30 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {creating ? "创建中…" : "创建"}
        </button>
      </form>

      {/* 已有图片组 */}
      {groups.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-gray-500">
          还没有图片组，创建一个吧
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li key={group.id} className="glass rounded-2xl p-5">
              {editingId === group.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingId === group.id}
                      onClick={() => handleUpdateGroup(group.id)}
                      className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
                    >
                      {savingId === group.id ? "保存中…" : "保存"}
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold">{group.title}</h2>
                      <p className="font-crt text-sm text-orange-400">
                        {group.photoCount} 张照片
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(group.id)}
                        className="rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {expandedId === group.id ? "收起" : "管理图片"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditGroup(group)}
                        className="rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="rounded-full px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {/* 展开：组内图片管理 */}
                  {expandedId === group.id && (
                    <div className="mt-4 flex flex-col gap-4">
                      {/* 上传图片 */}
                      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                        <h3 className="font-crt text-sm text-orange-300">
                          上传图片
                        </h3>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                          className="text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-orange-500/20 file:px-3 file:py-1 file:text-sm file:text-orange-300 transition-colors hover:file:bg-orange-500/30"
                        />
                        <input
                          value={uploadCaption}
                          onChange={(e) => setUploadCaption(e.target.value)}
                          placeholder="图片备注（可选）"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          disabled={busyPhotoGroupId === group.id}
                          onClick={() => handleUploadAndAdd(group.id)}
                          className="self-start rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
                        >
                          {busyPhotoGroupId === group.id ? "上传中…" : "上传并添加"}
                        </button>
                      </div>

                      {/* 添加外链 */}
                      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                        <h3 className="font-crt text-sm text-orange-300">
                          添加外链图片
                        </h3>
                        <input
                          value={urlSrc}
                          onChange={(e) => setUrlSrc(e.target.value)}
                          placeholder="https://…"
                          className={inputClass}
                        />
                        <input
                          value={urlCaption}
                          onChange={(e) => setUrlCaption(e.target.value)}
                          placeholder="图片备注（可选）"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          disabled={busyPhotoGroupId === group.id}
                          onClick={() => handleAddUrl(group.id)}
                          className="self-start rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
                        >
                          {busyPhotoGroupId === group.id ? "添加中…" : "添加"}
                        </button>
                      </div>

                      {/* 已有图片 */}
                      {group.photos.length === 0 ? (
                        <p className="text-center text-sm text-gray-500">
                          还没有图片
                        </p>
                      ) : (
                        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {group.photos.map((photo) => (
                            <li key={photo.id} className="relative group/photo">
                              <img
                                src={photo.src}
                                alt={photo.caption}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="aspect-square w-full rounded-lg object-cover"
                              />
                              {photo.caption && (
                                <p className="truncate px-0.5 text-center text-xs text-gray-400">
                                  {photo.caption}
                                </p>
                              )}
                              <button
                                type="button"
                                disabled={deletingPhotoId === photo.id}
                                onClick={() => handleDeletePhoto(photo.id)}
                                aria-label="删除这张照片"
                                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover/photo:opacity-100 disabled:opacity-100"
                              >
                                {deletingPhotoId === photo.id ? "…" : "×"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
