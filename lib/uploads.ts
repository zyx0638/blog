import fs from "fs";
import path from "path";
import { randomUUID } from "node:crypto";

/** 上传目录：优先环境变量，默认 data/uploads（Docker 挂卷目录内，容器重建不丢失） */
export const uploadDir =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

/** 允许的图片 MIME → 扩展名 */
export const ALLOWED_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** 上传文件名安全模式：UUID + 扩展名，天然排除 ..、/、\ 等路径穿越字符 */
export const UPLOAD_NAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|gif)$/i;

// 上传目录不会自动创建，先确保存在（与 lib/db.ts 的 data 目录处理一致）
fs.mkdirSync(uploadDir, { recursive: true });

/** 保存上传文件到 data/uploads，返回对外访问路径（/uploads/文件名） */
export async function saveUploadedFile(file: File): Promise<string> {
  const ext = ALLOWED_MIME_EXT[file.type]; // 调用方已校验 MIME 与大小
  if (!ext) throw new Error("不支持的图片类型");
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

/** 删除上传的图片文件（仅处理 /uploads/ 前缀，外部链接直接忽略；文件缺失时静默） */
export function deleteUploadedFile(src: string): void {
  if (!src.startsWith("/uploads/")) return;
  const filename = src.slice("/uploads/".length);
  if (!UPLOAD_NAME_PATTERN.test(filename)) return;
  try {
    fs.unlinkSync(path.join(uploadDir, filename));
  } catch {
    // 文件可能已不存在，忽略
  }
}
