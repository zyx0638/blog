import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchAnime } from "@/lib/bangumi";

/** 代理 Bangumi 搜索动画（浏览器不直连 Bangumi） */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const keyword = new URL(req.url).searchParams.get("keyword")?.trim() ?? "";
  if (!keyword) {
    return NextResponse.json({ error: "关键词不能为空" }, { status: 400 });
  }
  if (keyword.length > 50) {
    return NextResponse.json({ error: "关键词过长" }, { status: 400 });
  }

  try {
    const items = await searchAnime(keyword);
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "搜索失败" },
      { status: 502 }
    );
  }
}
