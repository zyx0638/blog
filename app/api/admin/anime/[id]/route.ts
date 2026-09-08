import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteAnime, getAnimeAdmin } from "@/lib/anime";
import { deleteUploadedFile } from "@/lib/uploads";

interface Params {
  params: { id: string };
}

/** 删除番剧（含本地封面文件清理） */
export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const anime = getAnimeAdmin(Number(params.id));
  if (!anime) {
    return NextResponse.json({ error: "番剧不存在" }, { status: 404 });
  }
  deleteAnime(Number(params.id));
  deleteUploadedFile(anime.cover);
  return NextResponse.json({ ok: true });
}
