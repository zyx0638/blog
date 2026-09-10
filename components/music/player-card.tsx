"use client";

import { useRef, useState } from "react";
import type { PlayMode, Song } from "@/lib/music";
import { formatTime } from "@/lib/music";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from "@/components/music/icons";

/** 播放模式 → 图标（列表循环为默认态，单曲/随机激活时点亮） */
function ModeIcon({ mode }: { mode: PlayMode }) {
  const active = mode !== "list";
  const cls = active ? "text-white" : "text-gray-500";
  if (mode === "one") return <RepeatOneIcon size={16} className={cls} />;
  if (mode === "shuffle") return <ShuffleIcon size={16} className={cls} />;
  return <RepeatIcon size={16} className={cls} />;
}

/**
 * 唱片封面层：真实封面图（浏览器直连 y.gtimg.cn），
 * URL 为空或加载失败回退 CSS 渐变。随唱片 key 切歌重挂载，本地失败状态自动复位。
 */
function DiscCover({ song }: { song: Song }) {
  const [failed, setFailed] = useState(false);
  if (!song.cover.url || failed) {
    return (
      <div
        className="absolute inset-[16%] rounded-full ring-1 ring-white/10"
        style={{ background: song.cover.gradient }}
      />
    );
  }
  return (
    <div className="absolute inset-[16%] overflow-hidden rounded-full bg-[#1c1c1c] ring-1 ring-white/10">
      <img
        src={song.cover.url}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        draggable={false}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** 左卡：旋转唱片 + 歌曲信息 + 进度条 + 播放控件（纯 props，状态由 music-player 持有） */
export default function PlayerCard({
  song,
  isPlaying,
  currentTime,
  duration,
  playMode,
  switching,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onCycleMode,
}: {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playMode: PlayMode;
  /** 播放详情取流中：唱片半透明呼吸，播放键仍可用（记录播放意图） */
  switching?: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onCycleMode: () => void;
}) {
  const draggingRef = useRef(false);

  function ratioFromEvent(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  }

  const percent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <section className="glass flex flex-col rounded-2xl p-6">
      {/* 唱片：key 保证切歌时重挂载，动画从头开始（有换碟感） */}
      <div className="flex flex-1 items-center justify-center py-4">
        <div
          key={song.songmid}
          className={`animate-spin-slow relative aspect-square w-48 rounded-full shadow-xl shadow-black/60 ring-1 ring-white/10 transition-opacity sm:w-52 ${
            isPlaying ? "" : "[animation-play-state:paused]"
          } ${switching ? "opacity-60 animate-pulse" : ""}`}
        >
          {/* 盘面纹理 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "repeating-radial-gradient(circle at center, #1c1c1c 0px, #1c1c1c 2px, #262626 3px, #1c1c1c 4px)",
            }}
          />
          {/* 封面：真实图片，失败回退渐变（见 DiscCover） */}
          <DiscCover song={song} />
          {/* 高光 */}
          <div
            className="absolute inset-[16%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.25), transparent 55%)",
            }}
          />
          {/* 中心孔 */}
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0a0a0a]" />
        </div>
      </div>

      {/* 歌曲信息 */}
      <div className="text-center">
        <h2 className="truncate text-xl font-bold text-white">{song.title}</h2>
        <p className="mt-1 truncate text-sm text-gray-400">{song.artist}</p>
      </div>

      {/* 进度条 */}
      <div className="mt-5 flex items-center gap-3">
        <span className="w-10 text-right text-xs tabular-nums text-gray-500">
          {formatTime(currentTime)}
        </span>
        <div
          role="slider"
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          className="group relative h-1.5 flex-1 cursor-pointer touch-none rounded-full bg-white/10"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            draggingRef.current = true;
            onSeek(ratioFromEvent(e) * duration);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) onSeek(ratioFromEvent(e) * duration);
          }}
          onPointerUp={() => (draggingRef.current = false)}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/80"
            style={{ width: `${percent}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${percent}%` }}
          />
        </div>
        <span className="w-10 text-xs tabular-nums text-gray-500">
          {formatTime(duration)}
        </span>
      </div>

      {/* 控件行：模式 / 上一曲 / 播放 / 下一曲 */}
      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={onCycleMode}
          title={
            playMode === "list"
              ? "列表循环"
              : playMode === "one"
                ? "单曲循环"
                : "随机播放"
          }
          className="rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <ModeIcon mode={playMode} />
        </button>
        <button
          type="button"
          onClick={onPrev}
          aria-label="上一曲"
          className="rounded-full p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <PrevIcon />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "暂停" : "播放"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 hover:bg-gray-300"
        >
          {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="下一曲"
          className="rounded-full p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <NextIcon />
        </button>
        <div className="w-9" aria-hidden="true" />
      </div>
    </section>
  );
}
