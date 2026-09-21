import { handleUploadRequest } from "@/lib/uploads";

/** 通用图片上传接口：文章封面、说说封面等使用（multipart，字段名 file） */
export async function POST(req: Request) {
  return handleUploadRequest(req);
}
