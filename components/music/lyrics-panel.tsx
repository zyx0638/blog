"use client";

import { useEffect, useMemo, useRef } from "react";
import { findActiveLine, parseLrc } from "@/lib/music";

/** 歌词视图：当前行背景色块高亮 + 自动滚动到可视区中间 */
export default function LyricsPanel({
  lrc,
  currentTime,
  loading,
}: {
  lrc: string;
  currentTime: number;
  /** 歌词取流中（切歌瞬间歌详情未返回）：显示加载提示而非旧歌词 */
  loading?: boolean;
}) {
  const lines = useMemo(() => parseLrc(lrc), [lrc]);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef(0);

  const activeIndex = useMemo(() => {
    const idx = findActiveLine(lines, currentTime, hintRef.current);
    hintRef.current = Math.max(idx, 0);
    return idx;
  }, [lines, currentTime]);

  // 仅当行变化时滚动（timeupdate 高频更新不会重复触发）
  useEffect(() => {
    if (activeIndex < 0) return;
    const container = containerRef.current;
    const el = activeLineRef.current;
    if (!container || !el) return;
    const top = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 space-y-1 overflow-y-auto px-6 py-4"
    >
      {loading ? (
        <p className="py-16 text-center text-gray-500">歌词加载中…</p>
      ) : lines.length === 0 ? (
        <p className="py-16 text-center text-gray-500">暂无歌词</p>
      ) : (
        lines.map((line, i) => (
          <p
            key={`${i}-${line.time}`}
            ref={i === activeIndex ? activeLineRef : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm leading-relaxed transition-colors duration-300 ${
              i === activeIndex
                ? "bg-white/10 font-medium text-white"
                : "text-gray-500"
            }`}
          >
            {line.text}
          </p>
        ))
      )}
    </div>
  );
}
