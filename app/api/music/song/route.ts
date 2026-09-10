import { NextResponse } from "next/server";
import { getSongLyric, getSongVkeys } from "@/lib/qqmusic";

export const dynamic = "force-dynamic";

/**
 * 单曲播放详情：播放链接（vkey，服务端 5min 缓存）+ 歌词（LRC 原文，24h 缓存）。
 * purl 为空（VIP/版权受限）时 url 为空、blocked 为 true，客户端提示并自动跳下一首。
 */
export async function GET(req: Request) {
  const mid = new URL(req.url).searchParams.get("mid")?.trim() ?? "";
  // 白名单校验，防任意字符串透传 QQ 网关
  if (!/^[A-Za-z0-9]{1,64}$/.test(mid)) {
    return NextResponse.json({ error: "无效的歌曲 ID" }, { status: 400 });
  }

  try {
    const [urlMap, lyric] = await Promise.all([
      getSongVkeys([mid]),
      getSongLyric(mid),
    ]);
    const url = urlMap.get(mid) ?? "";
    return NextResponse.json(
      { url, lyric, blocked: !url },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "歌曲信息加载失败" },
      { status: 502 }
    );
  }
}
