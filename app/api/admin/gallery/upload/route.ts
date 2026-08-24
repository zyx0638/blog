import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ALLOWED_MIME_EXT, saveUploadedFile } from "@/lib/uploads";

/** 单张图片大小上限：10MB */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** 上传图片文件（multipart，字段名 file），返回对外访问路径 */
export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }
  // 扩展名由声明的 MIME 决定，不信任客户端文件名
  if (!(file.type in ALLOWED_MIME_EXT)) {
    return NextResponse.json(
      { error: "仅支持 JPEG / PNG / WebP / GIF 图片" },
      { status: 400 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "图片不能超过 10MB" }, { status: 413 });
  }

  try {
    const src = await saveUploadedFile(file);
    return NextResponse.json({ src }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "上传失败" },
      { status: 400 }
    );
  }
}
