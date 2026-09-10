/**
 * 音乐模块数据层：歌曲结构 + LRC 解析 + 播放工具纯函数。
 * 真实数据来自 QQ 音乐公开接口（服务端封装见 lib/qqmusic.ts），
 * 经由 /api/music/* 路由产出 Song 结构供客户端消费。
 */

export interface Song {
  /** QQ 音乐全局唯一歌曲 ID（原 demo 的 id 字段） */
  songmid: string;
  title: string;
  artist: string;
  /** 时长（秒），QQ 接口提供，可能为 0 */
  interval: number;
  /** 专辑 ID，用于构造封面 URL */
  albummid: string;
  /** 封面：直链 URL（空时渲染 gradient）+ 渐变 fallback + 强调色（歌单当前曲色条） */
  cover: { url: string; gradient: string; accent: string };
}

export type PlayMode = "list" | "one" | "shuffle";

export interface LrcLine {
  time: number; // 秒（浮点）
  text: string;
}

/** 渐变调色板：songmid 哈希取模，服务端/客户端结果一致（内联 style 使用；tailwind 不扫描 lib/，不能写类名） */
const COVER_PALETTE: { gradient: string; accent: string }[] = [
  { gradient: "linear-gradient(135deg, #7c3aed, #1e40af)", accent: "#a78bfa" },
  { gradient: "linear-gradient(135deg, #f59e0b, #dc2626)", accent: "#fbbf24" },
  { gradient: "linear-gradient(135deg, #06b6d4, #0f766e)", accent: "#67e8f9" },
  { gradient: "linear-gradient(135deg, #ec4899, #7c3aed)", accent: "#f9a8d4" },
  { gradient: "linear-gradient(135deg, #22c55e, #065f46)", accent: "#86efac" },
  { gradient: "linear-gradient(135deg, #ef4444, #7f1d1d)", accent: "#fca5a5" },
  { gradient: "linear-gradient(135deg, #3b82f6, #1e3a8a)", accent: "#93c5fd" },
  { gradient: "linear-gradient(135deg, #a855f7, #4c1d95)", accent: "#d8b4fe" },
];

/** songmid → 调色板项（djb2 哈希，稳定跨请求） */
export function gradientFromSeed(seed: string): {
  gradient: string;
  accent: string;
} {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return COVER_PALETTE[h % COVER_PALETTE.length];
}

/** LRC 时间标签：[mm:ss.xx] 或 [mm:ss.xxx] */
const TIME_TAG_RE = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** 解析 LRC 文本为按时间排序的歌词行；支持一行多时间戳；跳过无时间标签与空文本行 */
export function parseLrc(raw: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const tags = Array.from(line.matchAll(TIME_TAG_RE));
    if (tags.length === 0) continue;
    const text = line.replace(TIME_TAG_RE, "").trim();
    if (!text) continue;
    for (const [, mm, ss, frac] of tags) {
      // 小数部分：2 位按百分秒，3 位按毫秒，缺省 0
      const f = frac ? Number(frac) / (frac.length === 2 ? 100 : 1000) : 0;
      out.push({ time: Number(mm) * 60 + Number(ss) + f, text });
    }
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

/**
 * 查找当前播放时间对应的歌词行索引：利用时间单调递增，从上次位置（hint）出发扫描，
 * 时间回退（拖动进度条）时自动回扫；在第一行之前返回 -1。
 */
export function findActiveLine(
  lines: LrcLine[],
  time: number,
  hint: number
): number {
  if (lines.length === 0) return -1;
  let i = Math.max(0, Math.min(hint, lines.length - 1));
  while (i > 0 && lines[i].time > time) i--;
  while (i + 1 < lines.length && lines[i + 1].time <= time) i++;
  return lines[i].time <= time ? i : -1;
}

/** 秒 → mm:ss 显示 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** 计算下一曲索引：单曲循环不动，随机模式随机且不等于当前，列表循环 +1 绕回 */
export function pickNextIndex(
  current: number,
  length: number,
  mode: PlayMode
): number {
  if (length <= 1) return 0;
  if (mode === "one") return current;
  if (mode === "shuffle") {
    const next = Math.floor(Math.random() * length);
    return next === current ? (next + 1) % length : next;
  }
  return (current + 1) % length;
}
