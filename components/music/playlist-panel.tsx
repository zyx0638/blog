"use client";

import type { Song } from "@/lib/music";
import { formatTime } from "@/lib/music";

/** 歌单视图：歌曲列表，当前曲用其封面强调色色条 + 白字高亮，点击切歌 */
export default function PlaylistPanel({
  title,
  songs,
  currentIndex,
  onSelect,
}: {
  title: string;
  songs: Song[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 歌单名：固定不随列表滚动 */}
      {title && (
        <div className="border-b border-white/10 px-4 py-2.5">
          <p className="truncate text-xs text-gray-500">
            歌单 · {title}（共 {songs.length} 首）
          </p>
        </div>
      )}
      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {songs.map((song, i) => {
          const active = i === currentIndex;
          return (
            <li key={song.songmid}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-white/5" : "hover:bg-white/5"
                }`}
              >
                {/* 当前曲强调色条 */}
                <span
                  className="h-8 w-1 shrink-0 rounded-full transition-opacity"
                  style={{
                    background: song.cover.accent,
                    opacity: active ? 1 : 0,
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-medium ${
                      active ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {song.title}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {song.artist}
                  </span>
                </span>
                {active ? (
                  <span className="shrink-0 text-xs text-gray-400">播放中</span>
                ) : (
                  song.interval > 0 && (
                    <span className="shrink-0 text-xs tabular-nums text-gray-600">
                      {formatTime(song.interval)}
                    </span>
                  )
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
