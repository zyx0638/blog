import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPhotoGroup, getAllPhotoGroupsAdmin } from "@/lib/gallery";

/** 列出所有图片组（含组内图片） */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getAllPhotoGroupsAdmin());
}

/** 新建图片组 */
export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    const description = String(body.description ?? "").trim();

    const group = createPhotoGroup({ title, description });
    return NextResponse.json(group, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 400 }
    );
  }
}
