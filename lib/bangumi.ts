// 统一使用 undici 自带的 fetch：Node 内置 fetch 无法使用新版 undici 的 ProxyAgent（dispatcher 协议不兼容）
import { fetch as undiciFetch, ProxyAgent } from "undici";
import { ALLOWED_MIME_EXT, MAX_UPLOAD_BYTES, saveUploadedFile } from "@/lib/uploads";

/**
 * 可选 HTTP 代理：大陆网络直连 api.bgm.tv 会遭遇 DNS 污染（解析到境外被封 IP），
 * 需经代理访问（如本机 Clash 127.0.0.1:7897）。通过环境变量 BANGUMI_PROXY 配置，未设置则直连。
 */
const proxyUrl = process.env.BANGUMI_PROXY?.trim();
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
const proxyInit = proxyAgent ? { dispatcher: proxyAgent } : {};

/** Bangumi 公开 API base URL */
const BANGUMI_API_BASE = "https://api.bgm.tv";

/** Bangumi 官方要求可联系的 User-Agent；本仓库暂无公开 remote，占位待替换 */
const BANGUMI_USER_AGENT = "kobe-lab-blog/1.0 (https://github.com/xxx/xxx)";

const API_TIMEOUT_MS = 10_000;
const IMAGE_TIMEOUT_MS = 15_000;
/** 与 Bangumi 官方 300s 缓存建议一致 */
const DETAIL_CACHE_TTL_MS = 300_000;

/** 搜索结果条目（camelCase）的最小字段结构 */
interface BgmSearchResponse {
  data?: Array<{
    id: number;
    name: string;
    nameCn?: string;
    images?: { common?: string; large?: string };
  }>;
}

/** 番剧详情（snake_case）的最小字段结构 */
interface BgmSubjectResponse {
  id: number;
  name: string;
  name_cn?: string;
  images?: { common?: string; large?: string };
}

export interface AnimeSearchItem {
  bangumiId: number;
  title: string;
  coverUrl: string;
}

export interface AnimeDetail {
  bangumiId: number;
  title: string;
  coverUrl: string;
}

const BANGUMI_HEADERS = {
  "User-Agent": BANGUMI_USER_AGENT,
  Accept: "application/json",
};

/** 详情缓存：bangumiId → 过期时间 + 数据（进程内，TTL 300s） */
const detailCache = new Map<number, { expiresAt: number; data: AnimeDetail }>();

/** 按 Bangumi 关键词搜索动画（type 2），返回归一化结果列表 */
export async function searchAnime(keyword: string): Promise<AnimeSearchItem[]> {
  // 注意：limit/offset 必须放在 query 串，放 body 会被忽略
  const res = await undiciFetch(
    `${BANGUMI_API_BASE}/v0/search/subjects?limit=10`,
    {
      method: "POST",
      headers: { ...BANGUMI_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, sort: "match", filter: { type: [2] } }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cache: "no-store",
      ...proxyInit,
    }
  );
  if (!res.ok) {
    throw new Error(`Bangumi 搜索接口异常（HTTP ${res.status}）`);
  }

  let json: BgmSearchResponse;
  try {
    json = (await res.json()) as BgmSearchResponse;
  } catch {
    throw new Error("Bangumi 返回数据格式异常");
  }

  return (json.data ?? []).map((item) => ({
    bangumiId: item.id,
    title: (item.nameCn ?? "").trim() || item.name.trim(),
    // 搜索仅用于管理端缩略图预览，取较小的 common 图
    coverUrl: item.images?.common ?? item.images?.large ?? "",
  }));
}

/** 获取番剧详情（带 300s 进程内缓存），title 为 name_cn 优先，coverUrl 取 large 用于下载 */
export async function fetchAnimeDetail(bangumiId: number): Promise<AnimeDetail> {
  const cached = detailCache.get(bangumiId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const res = await undiciFetch(`${BANGUMI_API_BASE}/v0/subjects/${bangumiId}`, {
    headers: BANGUMI_HEADERS,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
    cache: "no-store",
    ...proxyInit,
  });
  if (res.status === 404) {
    throw new Error("番剧不存在");
  }
  if (!res.ok) {
    throw new Error(`Bangumi 接口异常（HTTP ${res.status}）`);
  }

  let json: BgmSubjectResponse;
  try {
    json = (await res.json()) as BgmSubjectResponse;
  } catch {
    throw new Error("Bangumi 返回数据格式异常");
  }

  const data: AnimeDetail = {
    bangumiId: json.id,
    title: (json.name_cn ?? "").trim() || json.name.trim(),
    coverUrl: json.images?.large ?? json.images?.common ?? "",
  };
  detailCache.set(bangumiId, { expiresAt: Date.now() + DETAIL_CACHE_TTL_MS, data });
  return data;
}

/** URL 后缀 → MIME 兜底映射（响应头 Content-Type 不可用时使用） */
const EXT_MIME_FALLBACK: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** 下载封面到 data/uploads，返回 /uploads/xxx 路径；coverUrl 为空时返回空串 */
export async function downloadCoverToUploads(coverUrl: string): Promise<string> {
  if (!coverUrl) return "";

  const res = await undiciFetch(coverUrl, {
    headers: { "User-Agent": BANGUMI_USER_AGENT },
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    cache: "no-store",
    ...proxyInit,
  });
  if (!res.ok) {
    throw new Error("封面下载失败");
  }

  // MIME 优先取响应头，不可用时按 URL 后缀推断
  let mime = (res.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!(mime in ALLOWED_MIME_EXT)) {
    const ext = coverUrl.toLowerCase().match(/\.(jpe?g|png|webp|gif)(?:$|\?)/)?.[1];
    mime = ext ? (EXT_MIME_FALLBACK[`.${ext}`] ?? "") : "";
  }
  if (!(mime in ALLOWED_MIME_EXT)) {
    throw new Error("不支持的封面图片类型");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("封面下载失败");
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("封面超过 10MB");
  }

  const ext = ALLOWED_MIME_EXT[mime];
  const file = new File([new Uint8Array(buffer)], `cover${ext}`, { type: mime });
  return saveUploadedFile(file);
}
