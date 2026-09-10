import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";
import { coverUrl, getPlaylistDetail } from "@/lib/qqmusic";
import { gradientFromSeed } from "@/lib/music";
import type { Song } from "@/lib/music";

// 客户端 fetch 的数据路由，禁止 Next 构建期静态化（否则 musicPlaylistId 与缓存都会被固化）
export const dynamic = "force-dynamic";

/**
 * 音乐歌单：读取 siteConfig.musicPlaylistId 拉取固定歌单（服务端 10min 缓存）。
 * 未配置返回 200 + error 标识（区别于服务端异常），客户端据此显示未配置提示。
 */
export async function GET() {
  const disstid = siteConfig.musicPlaylistId.trim();
  if (!disstid) {
    return NextResponse.json({ error: "NOT_CONFIGURED" });
  }

  try {
    const list = await getPlaylistDetail(disstid);
    const songs: Song[] = list.songs.map((s) => ({
      songmid: s.songmid,
      title: s.title,
      artist: s.artist,
      interval: s.interval,
      albummid: s.albummid,
      cover: { url: coverUrl(s.albummid, "r300"), ...gradientFromSeed(s.songmid) },
    }));
    return NextResponse.json({
      playlist: { title: list.title, total: list.total, songs },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "歌单加载失败" },
      { status: 502 }
    );
  }
}
