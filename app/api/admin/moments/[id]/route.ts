import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteMoment, getMomentAdmin, updateMoment } from "@/lib/moments";
import { deleteUploadedFile } from "@/lib/uploads";

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
    const cover = String(body.cover ?? "");

    const existing = getMomentAdmin(Number(params.id));
    const moment = updateMoment(Number(params.id), { date, content, cover });
    if (!moment) {
      return NextResponse.json({ error: "碎碎念不存在" }, { status: 404 });
    }
    // 换图或移除封面时，清理旧的本地封面文件
    if (existing && existing.cover && existing.cover !== cover) {
      deleteUploadedFile(existing.cover);
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
  const moment = getMomentAdmin(Number(params.id));
  if (!moment) {
    return NextResponse.json({ error: "碎碎念不存在" }, { status: 404 });
  }
  deleteMoment(Number(params.id));
  deleteUploadedFile(moment.cover);
  return NextResponse.json({ ok: true });
}
