import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteMoment, updateMoment } from "@/lib/moments";

interface Params {
  params: { id: string };
}

/** 更新碎碎念 */
export async function PUT(req: Request, { params }: Params) {
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

    const moment = updateMoment(Number(params.id), { date, content });
    if (!moment) {
      return NextResponse.json({ error: "碎碎念不存在" }, { status: 404 });
    }
    return NextResponse.json(moment);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新失败" },
      { status: 400 }
    );
  }
}

/** 删除碎碎念 */
export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (!deleteMoment(Number(params.id))) {
    return NextResponse.json({ error: "碎碎念不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
