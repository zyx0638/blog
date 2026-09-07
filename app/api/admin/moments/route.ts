import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createMoment, getAllMomentsAdmin } from "@/lib/moments";

/** 列出所有碎碎念 */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getAllMomentsAdmin());
}

/** 新建碎碎念 */
export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const date = String(body.date ?? "").trim();
    if (!date) {
      return NextResponse.json({ error: "日期不能为空" }, { status: 400 });
    }
    const content = String(body.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    const moment = createMoment({
      date,
      content,
      cover: String(body.cover ?? ""),
    });
    return NextResponse.json(moment, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 400 }
    );
  }
}
