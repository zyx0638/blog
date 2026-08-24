import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addPhoto, getPhotoGroupById } from "@/lib/gallery";
import { UPLOAD_NAME_PATTERN } from "@/lib/uploads";

interface Params {
  params: { id: string };
}

/** 组内添加图片：src 必须是本地上传路径或 http(s) 外链 */
export async function POST(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const src = String(body.src ?? "").trim();
    const isLocal =
      src.startsWith("/uploads/") &&
      UPLOAD_NAME_PATTERN.test(src.slice("/uploads/".length));
    const isExternal = /^https?:\/\//.test(src);
    if (!isLocal && !isExternal) {
      return NextResponse.json({ error: "图片地址不合法" }, { status: 400 });
    }
    const caption = String(body.caption ?? "").trim();

    const groupId = Number(params.id);
    // 组不存在时返回 404，避免绕过外键插入孤儿图片
    if (!getPhotoGroupById(groupId)) {
      return NextResponse.json({ error: "图片组不存在" }, { status: 404 });
    }
    const photo = addPhoto(groupId, { src, caption });
    return NextResponse.json(photo, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "添加失败" },
      { status: 400 }
    );
  }
}
