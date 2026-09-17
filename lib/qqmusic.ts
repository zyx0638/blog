// 统一使用 undici 自带的 fetch：Node 内置 fetch 无法使用新版 undici 的 ProxyAgent（dispatcher 协议不兼容）
import { fetch as undiciFetch, ProxyAgent } from "undici";

/**
 * QQ 音乐公开接口封装（非官方）：搜索 / 歌单 / 播放链接（vkey）/ 歌词。
 * 接口无 CORS 头且必须带 Referer，全部请求只应在服务端（API 路由）发起。
 *
 * 可选 HTTP 代理：本地开发开着 Clash 等工具时可能拦截 y.qq.com，
 * 通过环境变量 MUSIC_PROXY 配置（如 http://127.0.0.1:7897），未设置则直连（阿里云直连实测可用）。
 */
const proxyUrl = process.env.MUSIC_PROXY?.trim();
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
const proxyInit = proxyAgent ? { dispatcher: proxyAgent } : {};

/** u.y.qq.com 统一网关：歌单 / vkey / 歌词均走这里 POST */
const GATEWAY_URL = "https://u.y.qq.com/cgi-bin/musicu.fcg";
const SEARCH_URL = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp";

const API_TIMEOUT_MS = 10_000;
/** 歌单缓存 TTL：QQ 对匿名歌单查询有限流，缓存久一点减少请求频率 */
const PLAYLIST_CACHE_TTL_MS = 30 * 60_000;
/** vkey 实际有效约 2h，缓存取 5min 保证换链接及时 */
const VKEY_CACHE_TTL_MS = 300_000;
/** 歌词基本不变，缓存 24h */
const LYRIC_CACHE_TTL_MS = 24 * 60 * 60_000;
/** 歌单拉取上限（分页循环兜底，正常歌单远小于此） */
const MAX_SONGS = 1000;

/** QQ 接口必需请求头（实测无 Referer 会失败） */
const QQ_HEADERS = {
  Referer: "https://y.qq.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

/** 歌单/搜索结果中的歌曲条目（camelCase 最小结构） */
export interface QQSongListItem {
  /** 全局唯一歌曲 ID */
  songmid: string;
  title: string;
  /** 多歌手用 " / " 连接 */
  artist: string;
  albummid: string;
  /** 时长秒，可能为 0 */
  interval: number;
}

export interface QQPlaylist {
  title: string;
  total: number;
  songs: QQSongListItem[];
}

// ---- 接口返回的最小字段结构（避开 any：no-explicit-any 为构建错误）----

/** songlist / 搜索结果里的歌曲原始条目：
 *  歌单接口字段为 mid/name/album.mid，搜索接口为 songmid/songname/albummid，两种都兼容 */
interface RawSongItem {
  mid?: string;
  songmid?: string;
  name?: string;
  songname?: string;
  title?: string;
  singer?: Array<{ name?: string }>;
  albummid?: string;
  album?: { mid?: string };
  interval?: number | string;
}

/** CgiGetDiss（歌单）data */
interface DissData {
  songlist?: RawSongItem[];
  dirinfo?: { title?: string };
  total_song_num?: number;
}

/** CgiGetVkey（播放链接）data */
interface VkeyData {
  sip?: string[];
  midurlinfo?: Array<{ purl?: string }>;
}

/** GetPlayLyricInfo（歌词）data：lyric 为 base64 编码的 LRC */
interface LyricData {
  lyric?: string;
}

/** client_search_cp（搜索）响应 */
interface SearchData {
  data?: {
    song?: {
      list?: RawSongItem[];
    };
  };
}

/** 网关响应外层：req_0.code !== 0 视为失败 */
interface GatewayResponse<T> {
  req_0?: {
    code?: number;
    data?: T;
  };
}

// ---- 进程内缓存（低流量个人博客足够，同 lib/bangumi.ts 取舍）----
const playlistCache = new Map<string, { expiresAt: number; data: QQPlaylist }>();
const vkeyCache = new Map<string, { expiresAt: number; sip: string[]; purl: string }>();
const lyricCache = new Map<string, { expiresAt: number; lyric: string }>();

/** 通用 QQ 接口请求：统一请求头 + 超时 + 代理 + 失败重试 1 次（接口偶发抽风）
 *  返回类型不标注、init 用 undici 自带类型：undici 的 RequestInit/Response 与 DOM 类型不兼容（同 bangumi.ts） */
async function fetchQQMusic(
  url: string,
  init?: Parameters<typeof undiciFetch>[1],
  retriesLeft = 1
) {
  try {
    return await undiciFetch(url, {
      ...init,
      headers: { ...QQ_HEADERS, ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cache: "no-store",
      ...proxyInit,
    });
  } catch {
    if (retriesLeft > 0) return fetchQQMusic(url, init, retriesLeft - 1);
    throw new Error("QQ 音乐接口请求失败");
  }
}

/** 统一网关 POST：返回 req_0.data；code !== 0 等 5s 重试一次（QQ 对匿名歌单查询有限流，实测 10004 数分钟后恢复），仍失败抛错 */
async function gatewayQuery<T>(
  module: string,
  method: string,
  param: unknown,
  retriesLeft = 1
): Promise<T> {
  const res = await fetchQQMusic(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ req_0: { module, method, param } }),
  });
  if (!res.ok) {
    throw new Error(`QQ 音乐网关异常（HTTP ${res.status}）`);
  }
  let json: GatewayResponse<T>;
  try {
    json = (await res.json()) as GatewayResponse<T>;
  } catch {
    throw new Error("QQ 音乐返回数据格式异常");
  }
  if (json.req_0?.code !== 0) {
    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 5_000));
      return gatewayQuery(module, method, param, retriesLeft - 1);
    }
    throw new Error(
      `QQ 音乐网关返回错误（code ${json.req_0?.code ?? "无"}，param ${JSON.stringify(param).slice(0, 120)}）`
    );
  }
  return json.req_0?.data as T;
}

/** songlist 条目 → 最小结构 */
function normalizeSong(s: RawSongItem): QQSongListItem {
  return {
    songmid: s.mid ?? s.songmid ?? "",
    title: s.name ?? s.songname ?? s.title ?? "",
    artist: (s.singer ?? []).map((x) => x.name ?? "").join(" / "),
    albummid: s.albummid ?? s.album?.mid ?? "",
    interval: Number(s.interval) || 0,
  };
}

/** 关键词搜索（保留给未来管理端用，本期未接路由） */
export async function searchSongs(
  keyword: string,
  limit = 20
): Promise<QQSongListItem[]> {
  const res = await fetchQQMusic(
    `${SEARCH_URL}?w=${encodeURIComponent(keyword)}&format=json&p=1&n=${limit}`
  );
  if (!res.ok) {
    throw new Error(`QQ 音乐搜索异常（HTTP ${res.status}）`);
  }
  let json: SearchData;
  try {
    json = (await res.json()) as SearchData;
  } catch {
    throw new Error("QQ 音乐返回数据格式异常");
  }
  return (json.data?.song?.list ?? []).map(normalizeSong);
}

/**
 * 歌单详情：song_begin 分页拉全量，带 30min 缓存。
 * 优先 CgiGetDiss（100/页）；QQ 对其匿名查询有限流（code 10004，触发后数分钟恢复），
 * 失败时自动回落 uniform_get_Dissinfo（30/页，独立限流，实测互不影响）。
 */
export async function getPlaylistDetail(disstid: string): Promise<QQPlaylist> {
  const cached = playlistCache.get(disstid);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  let viaUniform = false;

  /** 拉一页：返回歌曲列表 + 歌单名 + 总数（CgiGetDiss 或 uniform 两种实现） */
  async function fetchPage(begin: number): Promise<{
    list: RawSongItem[];
    title: string;
    total: number;
  }> {
    if (viaUniform) {
      const data = await gatewayQuery<DissData>(
        "music.srfDissInfo.aiDissInfo",
        "uniform_get_Dissinfo",
        {
          disstid: Number(disstid),
          enc_host_uin: "",
          tag: 1,
          userinfo: 1,
          song_begin: begin,
          song_num: 30,
          onlysonglist: 1,
        }
      );
      return {
        list: data.songlist ?? [],
        title: data.dirinfo?.title ?? "",
        total: data.total_song_num ?? 0,
      };
    }
    const data = await gatewayQuery<DissData>(
      "srf_diss_info.DissInfoServer",
      "CgiGetDiss",
      // uin 必填：不带 uin 时该接口会返回 code 10004（实测）
      { disstid: Number(disstid), onlysonglist: 0, song_begin: begin, song_num: 100, uin: "0" }
    );
    return {
      list: data.songlist ?? [],
      title: data.dirinfo?.title ?? "",
      total: data.total_song_num ?? 0,
    };
  }

  const songs: QQSongListItem[] = [];
  let title = "";
  let total = 0;
  for (let begin = 0; begin < MAX_SONGS; ) {
    let page: { list: RawSongItem[]; title: string; total: number };
    try {
      page = await fetchPage(begin);
    } catch (e) {
      // CgiGetDiss 失败（限流等）→ 切换 uniform 从头重拉；uniform 也失败则放弃
      if (!viaUniform) {
        viaUniform = true;
        begin = 0;
        songs.length = 0;
        title = "";
        total = 0;
        continue;
      }
      throw e;
    }
    songs.push(...page.list.map(normalizeSong));
    if (!title) title = page.title;
    total = page.total || total;
    const pageSize = viaUniform ? 30 : 100;
    if (page.list.length < pageSize) break;
    begin += pageSize;
  }

  // 限流时接口可能返回 code 0 但 songlist 为空：当作失败，避免误显示「歌单为空」
  if (songs.length === 0) {
    throw new Error("歌单加载失败（接口返回空，可能被限流）");
  }

  const playlist: QQPlaylist = { title, total, songs };
  playlistCache.set(disstid, {
    expiresAt: Date.now() + PLAYLIST_CACHE_TTL_MS,
    data: playlist,
  });
  return playlist;
}

/** 批量取播放链接：返回 songmid → 完整 URL（VIP/版权受限为 ""）；带 5min 缓存 */
export async function getSongVkeys(
  songmids: string[]
): Promise<Map<string, string>> {
  // 先查缓存，未命中的 mid 再请求网关（接口支持批量，未命中统一一次请求）
  const miss = songmids.filter((m) => {
    const c = vkeyCache.get(m);
    return !c || c.expiresAt <= Date.now();
  });
  if (miss.length > 0) {
    const data = await gatewayQuery<VkeyData>("vkey.GetVkeyServer", "CgiGetVkey", {
      guid: String(Math.random()).slice(2),
      songmid: miss,
      songtype: miss.map(() => 0),
      uin: "0",
      loginflag: 1,
      platform: "20",
    });
    const sip = data.sip ?? [];
    const infos = data.midurlinfo ?? [];
    infos.forEach((info, i) => {
      vkeyCache.set(miss[i], {
        expiresAt: Date.now() + VKEY_CACHE_TTL_MS,
        sip,
        purl: info?.purl ?? "",
      });
    });
  }
  return new Map(
    songmids.map((m) => {
      const c = vkeyCache.get(m)!;
      return [m, c.purl ? `${c.sip[0] ?? ""}${c.purl}` : ""];
    })
  );
}

/** 歌词：服务端解码 base64 为 LRC 原文（含 [ti:][ar:] 元数据行，parseLrc 天然跳过）；带 24h 缓存 */
export async function getSongLyric(songmid: string): Promise<string> {
  const cached = lyricCache.get(songmid);
  if (cached && cached.expiresAt > Date.now()) return cached.lyric;

  const data = await gatewayQuery<LyricData>(
    "music.musichallSong.PlayLyricInfo",
    "GetPlayLyricInfo",
    { songMID: songmid }
  );
  const raw = data.lyric ?? "";
  let lyric = "";
  if (raw) {
    try {
      lyric = Buffer.from(raw, "base64").toString("utf-8");
    } catch {
      lyric = ""; // 异常编码按无歌词处理
    }
  }
  lyricCache.set(songmid, {
    expiresAt: Date.now() + LYRIC_CACHE_TTL_MS,
    lyric,
  });
  return lyric;
}

/** 封面 URL 构造（纯函数）：albummid 为空返回 "" */
export function coverUrl(
  albummid: string,
  size: "r300" | "r90" = "r300"
): string {
  if (!albummid) return "";
  // 路径格式为 T002R300x300M000<albummid>.jpg：R 只出现一次，尺寸为纯数字
  const px = size === "r90" ? "90" : "300";
  return `https://y.gtimg.cn/music/photo_new/T002R${px}x${px}M000${albummid}.jpg`;
}
