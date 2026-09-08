"use client";

import { useEffect, useState } from "react";
import type { AdminAnime } from "@/lib/anime";
import type { AnimeSearchItem } from "@/lib/bangumi";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none";

/** 番剧管理：Bangumi 搜索添加 + 列表删除 */
export default function AnimeManager() {
  const [animes, setAnimes] = useState<AdminAnime[]>([]);
  const [loading, setLoading] = useState(true);

  // 搜索
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AnimeSearchItem[] | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const addedIds = new Set(animes.map((a) => a.bangumiId));

  async function load() {
    try {
      const res = await fetch("/api/admin/anime");
      if (res.ok) {
        setAnimes(await res.json());
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/anime/search?keyword=${encodeURIComponent(keyword.trim())}`
      );
      if (res.ok) {
        setResults(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "搜索失败");
        setResults([]);
      }
    } catch {
      setError("网络错误，请重试");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(item: AnimeSearchItem) {
    setAddingId(item.bangumiId);
    setError("");
    try {
      const res = await fetch("/api/admin/anime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bangumiId: item.bangumiId }),
      });
      if (res.ok) {
        setResults((prev) =>
          prev ? prev.filter((r) => r.bangumiId !== item.bangumiId) : null
        );
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "添加失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setAddingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除这部番剧？")) return;
    await fetch(`/api/admin/anime/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 搜索添加 */}
      <form
        onSubmit={handleSearch}
        className="glass flex flex-col gap-3 rounded-2xl p-5"
      >
        <h2 className="font-bold text-gray-200">添加番剧</h2>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入番剧名，搜索 Bangumi…"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={searching || !keyword.trim()}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            {searching ? "搜索中…" : "搜索"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {/* 搜索结果 */}
      {results !== null &&
        (results.length === 0 && !error ? (
          <p className="glass rounded-2xl p-8 text-center text-gray-500">
            没有找到相关番剧
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((item) => (
              <li
                key={item.bangumiId}
                className="glass flex items-center gap-4 rounded-2xl p-3"
              >
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-20 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-black/40">
                    <span className="text-gray-600">无图</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-200">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bangumi ID: {item.bangumiId}
                  </p>
                </div>
                {addedIds.has(item.bangumiId) ? (
                  <span className="shrink-0 rounded-full px-3 py-1 text-sm text-gray-500">
                    已添加
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    disabled={addingId === item.bangumiId}
                    className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
                  >
                    {addingId === item.bangumiId ? "添加中…" : "添加"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ))}

      {/* 已添加列表 */}
      <h2 className="mt-2 font-bold text-gray-200">已添加（{animes.length}）</h2>
      {loading ? (
        <p className="glass rounded-2xl p-8 text-center text-gray-500">加载中…</p>
      ) : animes.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-gray-500">
          还没有添加番剧，搜索一部试试
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {animes.map((anime) => (
            <li
              key={anime.id}
              className="glass flex items-center gap-4 rounded-2xl p-3"
            >
              {anime.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={anime.cover}
                  alt={anime.title}
                  className="h-20 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-black/40">
                  <span className="text-gray-600">无图</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-200">
                  {anime.title}
                </p>
                <p className="text-xs text-gray-500">
                  Bangumi ID: {anime.bangumiId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(anime.id)}
                className="shrink-0 rounded-full px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
