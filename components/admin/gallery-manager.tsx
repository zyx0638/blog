"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminPhotoGroup } from "@/lib/gallery";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none";

/** 待上传文件 + 其预览 URL */
interface PendingUpload {
  file: File;
  preview: string;
}

/** 文件多选与预览管理：自动生成/释放 object URL */
function useFileSelection() {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  // 组件卸载时兜底释放所有预览 URL
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  /** 替换选中文件并同步生成预览 URL，旧 URL 立即释放 */
  function setFiles(files: File[]) {
    previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
    const next = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    previewsRef.current = next.map((p) => p.preview);
    setPending(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    // 立即清空，否则下一轮再选同一个文件时不会触发 change
    e.target.value = "";
    if (selected.length === 0) return;
    // 多轮选择追加而不是覆盖；按 name|size|lastModified 去重
    const seen = new Set(
      pending.map((p) => `${p.file.name}|${p.file.size}|${p.file.lastModified}`)
    );
    const fresh = selected.filter(
      (f) => !seen.has(`${f.name}|${f.size}|${f.lastModified}`)
    );
    if (fresh.length === 0) return;
    setFiles([...pending.map((p) => p.file), ...fresh]);
  }

  function remove(index: number) {
    setFiles(pending.filter((_, i) => i !== index).map((p) => p.file));
  }

  function clear() {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return { pending, inputRef, handleChange, remove, clear };
}

/** 批量上传一组文件到指定图片组；返回失败信息（null 表示全部成功） */
async function uploadFilesToGroup(
  groupId: number,
  files: PendingUpload[],
  onProgress?: (done: number, total: number) => void
): Promise<string | null> {
  for (let i = 0; i < files.length; i++) {
    const { file } = files[i];
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/admin/gallery/upload", {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) {
      const data = await uploadRes.json().catch(() => ({}));
      return `${file.name}：${data.error ?? "上传失败"}`;
    }
    const { src } = await uploadRes.json();

    const addRes = await fetch(`/api/admin/gallery/${groupId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src }),
    });
    if (!addRes.ok) {
      const data = await addRes.json().catch(() => ({}));
      return `${file.name}：${data.error ?? "添加失败"}`;
    }
    onProgress?.(i + 1, files.length);
  }
  return null;
}

/** 照片墙管理：新建组（可带首批照片）+ 组内单按钮编辑（照片增删 / 改名 / 删组） */
export default function GalleryManager() {
  const [groups, setGroups] = useState<AdminPhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 新建组表单（选择本地文件 + 预览，随创建一起上传）
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const newFiles = useFileSelection();

  // 编辑组（一次编辑一组）
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const editFiles = useFileSelection();

  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [busyPhotoGroupId, setBusyPhotoGroupId] = useState<number | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "创建失败");
        return;
      }
      const group = await res.json();
      setNewTitle("");
      setNewDescription("");
      if (newFiles.pending.length > 0) {
        setUploadProgress({ done: 0, total: newFiles.pending.length });
        const err = await uploadFilesToGroup(
          group.id,
          newFiles.pending,
          (done, total) => setUploadProgress({ done, total })
        );
        if (err) {
          setError(`${err}（相册已创建，可稍后在编辑里继续添加）`);
          newFiles.clear();
          await load();
          return;
        }
      }
      newFiles.clear();
      await load();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setCreating(false);
      setUploadProgress(null);
    }
  }

  function startEditGroup(group: AdminPhotoGroup) {
    setEditingId(group.id);
    setEditTitle(group.title);
    setEditDescription(group.description);
    setError("");
  }

  function cancelEditFields(group: AdminPhotoGroup) {
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
    if (editingId === id) {
      setEditingId(null);
      editFiles.clear();
    }
    await load();
  }

  /** 编辑态：把选中的文件批量添加进组 */
  async function handleAddPhotos(groupId: number) {
    if (editFiles.pending.length === 0) {
      setError("请选择图片");
      return;
    }
    setBusyPhotoGroupId(groupId);
    setUploadProgress({ done: 0, total: editFiles.pending.length });
    setError("");
    try {
      const err = await uploadFilesToGroup(
        groupId,
        editFiles.pending,
        (done, total) => setUploadProgress({ done, total })
      );
      if (err) {
        setError(err);
        return;
      }
      editFiles.clear();
      await load();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusyPhotoGroupId(null);
      setUploadProgress(null);
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
      {/* 新建图片组：标题、描述 + 首批照片一起完成 */}
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={newFiles.inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={newFiles.handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => newFiles.inputRef.current?.click()}
            className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300 transition-colors hover:bg-orange-500/20"
          >
            选择本地文件
          </button>
          {newFiles.pending.length > 0 && (
            <span className="text-sm text-gray-400">
              已选 {newFiles.pending.length} 张
            </span>
          )}
        </div>
        {newFiles.pending.length > 0 && (
          <ul className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
            {newFiles.pending.map((p, i) => (
              <li key={p.preview} className="group/preview relative">
                <img
                  src={p.preview}
                  alt={p.file.name}
                  className="aspect-square w-full rounded-lg border border-white/10 object-cover"
                />
                <button
                  type="button"
                  aria-label={`移除 ${p.file.name}`}
                  onClick={() => newFiles.remove(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover/preview:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={creating || busyPhotoGroupId !== null}
          className="self-start rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-black shadow-md shadow-orange-500/30 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {creating
            ? uploadProgress
              ? `创建中… ${uploadProgress.done}/${uploadProgress.total}`
              : "创建中…"
            : "创建"}
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
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{group.title}</h2>
                  <p className="font-crt text-sm text-orange-400">
                    {group.photoCount} 张照片
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    editingId === group.id
                      ? setEditingId(null)
                      : startEditGroup(group)
                  }
                  className="shrink-0 rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {editingId === group.id ? "收起" : "编辑"}
                </button>
              </div>

              {/* 折叠态的照片预览：展示前 7 张缩略图，其余折叠成 +N */}
              {editingId !== group.id && group.photos.length > 0 && (
                <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {group.photos.slice(0, 7).map((photo) => (
                    <li key={photo.id}>
                      <img
                        src={photo.src}
                        alt={photo.caption}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    </li>
                  ))}
                  {group.photos.length > 7 && (
                    <li className="flex aspect-square items-center justify-center rounded-lg bg-black/40">
                      <span className="font-crt text-xs text-gray-500">
                        +{group.photos.length - 7}
                      </span>
                    </li>
                  )}
                </ul>
              )}

              {/* 编辑面板：照片增删 / 添加照片 / 相册信息 / 删除相册 */}
              {editingId === group.id && (
                <div className="mt-4 flex flex-col gap-4">
                  {/* 已有照片 */}
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

                  {/* 添加照片 */}
                  <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <h3 className="font-crt text-sm text-orange-300">
                      添加照片
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={editFiles.inputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={editFiles.handleChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFiles.inputRef.current?.click()}
                        className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300 transition-colors hover:bg-orange-500/20"
                      >
                        选择本地文件
                      </button>
                      {editFiles.pending.length > 0 && (
                        <span className="text-sm text-gray-400">
                          已选 {editFiles.pending.length} 张
                        </span>
                      )}
                    </div>
                    {editFiles.pending.length > 0 && (
                      <div className="flex flex-col items-start gap-3">
                        <ul className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
                          {editFiles.pending.map((p, i) => (
                            <li key={p.preview} className="group/preview relative">
                              <img
                                src={p.preview}
                                alt={p.file.name}
                                className="aspect-square w-full rounded-lg border border-white/10 object-cover"
                              />
                              <button
                                type="button"
                                aria-label={`移除 ${p.file.name}`}
                                onClick={() => editFiles.remove(i)}
                                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover/preview:opacity-100"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          disabled={
                            busyPhotoGroupId === group.id || creating
                          }
                          onClick={() => handleAddPhotos(group.id)}
                          className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-orange-400 disabled:opacity-50"
                        >
                          {uploadProgress
                            ? `上传中… ${uploadProgress.done}/${uploadProgress.total}`
                            : "添加照片"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 相册信息 */}
                  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                    <h3 className="font-crt text-sm text-orange-300">
                      相册信息
                    </h3>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={inputClass}
                      placeholder="组标题"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className={inputClass}
                      placeholder="组描述（可选）"
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
                        onClick={() => cancelEditFields(group)}
                        className="rounded-full px-4 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10"
                      >
                        取消
                      </button>
                    </div>
                  </div>

                  {/* 删除图片组 */}
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="self-end rounded-full px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    删除这个图片组
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
