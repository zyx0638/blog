import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_NAME_PATTERN, uploadDir } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** 对外提供上传的图片（无需登录）：读 data/uploads 下文件，回写 Content-Type 与缓存头 */
export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (!UPLOAD_NAME_PATTERN.test(filename)) {
    return NextResponse.json({ error: "文件名不合法" }, { status: 400 });
  }
  const filePath = path.join(uploadDir, filename);
  // 双保险：解析后的路径必须仍位于上传目录内
  if (!path.resolve(filePath).startsWith(path.resolve(uploadDir))) {
    return NextResponse.json({ error: "文件名不合法" }, { status: 400 });
  }
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        CONTENT_TYPES[path.extname(filename).toLowerCase()] ??
        "application/octet-stream",
      // 文件名是 UUID，内容永不变化，可以永久缓存
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
