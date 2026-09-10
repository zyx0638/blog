import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAbout, upsertAbout } from "@/lib/about";
import { deleteUploadedFile } from "@/lib/uploads";

/** 读取「关于」页信息（无记录时返回全空默认值） */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getAbout());
}

/** 更新「关于」页信息：头像 / ID / 简介 */
export async function PUT(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const avatar = String(body.avatar ?? "").trim();
    const handle = String(body.handle ?? "").trim();
    const content = String(body.content ?? "");

    // 头像更换/移除时清理旧上传文件（与文章封面的处理一致）
    const old = getAbout();
    if (old.avatar && old.avatar !== avatar) {
      deleteUploadedFile(old.avatar);
    }

    const about = upsertAbout({ avatar, handle, content });
    return NextResponse.json(about);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 }
    );
  }
}
