import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPost, getAllPostsAdmin, getPostBySlugAdmin } from "@/lib/posts";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 列出所有文章（含草稿） */
export async function GET(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getAllPostsAdmin());
}

/** 新建文章 */
export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slug = String(body.slug ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "slug 不能为空" }, { status: 400 });
    }
    if (!SLUG_PATTERN.test(slug)) {
      return NextResponse.json(
        { error: "slug 只能包含小写字母、数字和连字符，如 my-first-post" },
        { status: 400 }
      );
    }
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    const date = String(body.date ?? "").trim();
    if (!date) {
      return NextResponse.json({ error: "日期不能为空" }, { status: 400 });
    }
    if (getPostBySlugAdmin(slug)) {
      return NextResponse.json({ error: "该 slug 已存在" }, { status: 409 });
    }

    const post = createPost({
      slug,
      title,
      date,
      excerpt: String(body.excerpt ?? ""),
      content: String(body.content ?? ""),
      published: body.published === undefined ? true : Boolean(body.published),
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 400 }
    );
  }
}
