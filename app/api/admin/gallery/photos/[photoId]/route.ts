import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deletePhoto } from "@/lib/gallery";
import { deleteUploadedFile } from "@/lib/uploads";

interface Params {
  params: { photoId: string };
}

/** 删除组内单张图片（上传文件一并清理） */
export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const src = deletePhoto(Number(params.photoId));
  if (src === null) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }
  deleteUploadedFile(src);
  return NextResponse.json({ ok: true });
}
