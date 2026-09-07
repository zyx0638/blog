import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deletePost, getPostBySlugAdmin, updatePost } from "@/lib/posts";
import { deleteUploadedFile } from "@/lib/uploads";

interface Params {
  params: { slug: string };
}

/** 读取单篇文章（含草稿） */
export async function GET(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const post = getPostBySlugAdmin(params.slug);
  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  return NextResponse.json(post);
}

/** 更新文章（slug 不可改） */
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
    const date = String(body.date ?? "").trim();
    if (!date) {
      return NextResponse.json({ error: "日期不能为空" }, { status: 400 });
    }
    const cover = String(body.cover ?? "");

    const existing = getPostBySlugAdmin(params.slug);
    const post = updatePost(params.slug, {
      title,
      date,
      excerpt: String(body.excerpt ?? ""),
      content: String(body.content ?? ""),
      cover,
      published: body.published === undefined ? true : Boolean(body.published),
    });
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }
    // 换图或移除封面时，清理旧的本地封面文件
    if (existing && existing.cover && existing.cover !== cover) {
      deleteUploadedFile(existing.cover);
    }
    return NextResponse.json(post);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新失败" },
      { status: 400 }
    );
  }
}

/** 删除文章 */
export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const post = getPostBySlugAdmin(params.slug);
  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  deletePost(params.slug);
  deleteUploadedFile(post.cover);
  return NextResponse.json({ ok: true });
}
