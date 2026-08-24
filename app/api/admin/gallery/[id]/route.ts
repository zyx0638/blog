import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deletePhotoGroup, updatePhotoGroup } from "@/lib/gallery";
import { deleteUploadedFile } from "@/lib/uploads";

interface Params {
  params: { id: string };
}

/** 更新图片组 */
export async function PUT(req: Request, { params }: Params) {
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

    const group = updatePhotoGroup(Number(params.id), { title, description });
    if (!group) {
      return NextResponse.json({ error: "图片组不存在" }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新失败" },
      { status: 400 }
    );
  }
}

/** 删除图片组（连同组内图片与上传文件） */
export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const srcs = deletePhotoGroup(Number(params.id));
  if (srcs === null) {
    return NextResponse.json({ error: "图片组不存在" }, { status: 404 });
  }
  // 尽力清理磁盘上的上传文件；外部链接会被 deleteUploadedFile 内部忽略
  for (const src of srcs) {
    deleteUploadedFile(src);
  }
  return NextResponse.json({ ok: true });
}
