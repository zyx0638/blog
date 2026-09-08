import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createAnime,
  getAnimeByBangumiId,
  getAllAnimeAdmin,
} from "@/lib/anime";
import { downloadCoverToUploads, fetchAnimeDetail } from "@/lib/bangumi";
import { deleteUploadedFile } from "@/lib/uploads";

/** 列出所有番剧 */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getAllAnimeAdmin());
}

/** 添加番剧：只接收 bangumiId，标题与封面由服务端从 Bangumi 拉取并下载到本地 */
export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const bangumiId = Number((body as { bangumiId?: unknown }).bangumiId);
  if (!Number.isInteger(bangumiId) || bangumiId <= 0) {
    return NextResponse.json({ error: "bangumiId 无效" }, { status: 400 });
  }
  if (getAnimeByBangumiId(bangumiId)) {
    return NextResponse.json({ error: "这部番剧已添加过" }, { status: 409 });
  }

  try {
    const detail = await fetchAnimeDetail(bangumiId);
    let cover = "";
    if (detail.coverUrl) {
      cover = await downloadCoverToUploads(detail.coverUrl);
    }

    const anime = createAnime({ bangumiId, title: detail.title, cover });
    if (!anime) {
      // insert 失败（理论上仅 unique 竞争时发生）：清理已下载的封面文件，不留孤儿
      if (cover) deleteUploadedFile(cover);
      return NextResponse.json({ error: "保存失败" }, { status: 400 });
    }
    return NextResponse.json(anime, { status: 201 });
  } catch (e) {
    // Bangumi 接口异常 / 封面下载失败等上游问题
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "添加失败" },
      { status: 502 }
    );
  }
}
