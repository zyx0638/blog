import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { posts } from "@/db/schema";
import { db } from "@/lib/db";

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

/** 管理后台使用的文章类型：公开字段 + published */
export interface AdminPost extends Post {
  published: boolean;
}

const postFields = {
  slug: posts.slug,
  title: posts.title,
  date: posts.date,
  excerpt: posts.excerpt,
  content: posts.content,
};

const adminPostFields = { ...postFields, published: posts.published };

/** 读取所有已发布文章，按日期倒序排列 */
export function getAllPosts(): Post[] {
  return db
    .select(postFields)
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.date))
    .all();
}

/** 按 slug 读取已发布文章，不存在时返回 undefined */
export function getPostBySlug(slug: string): Post | undefined {
  return db
    .select(postFields)
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .get();
}

/** 后台：读取所有文章（含草稿），按日期倒序 */
export function getAllPostsAdmin(): AdminPost[] {
  return db.select(adminPostFields).from(posts).orderBy(desc(posts.date)).all();
}

/** 后台：按 slug 读取文章（含草稿） */
export function getPostBySlugAdmin(slug: string): AdminPost | undefined {
  return db
    .select(adminPostFields)
    .from(posts)
    .where(eq(posts.slug, slug))
    .get();
}

export interface PostInput {
  /** 可选：不传时自动生成「日期-8位随机字符」格式的 slug */
  slug?: string;
  title: string;
  date: string;
  excerpt?: string;
  content: string;
  published?: boolean;
}

/** 自动生成不重复的 slug：日期 + 8 位随机字符，如 2026-09-07-a1b2c3d4 */
function generateSlug(date: string): string {
  for (let i = 0; i < 5; i++) {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 8);
    const candidate = `${date}-${suffix}`;
    if (!getPostBySlugAdmin(candidate)) return candidate;
  }
  // 理论不会到达：兜底用时间戳
  return `${date}-${Date.now().toString(36)}`;
}

/** 后台：新建文章，slug 未传时自动生成，重复时返回 undefined */
export function createPost(input: PostInput): AdminPost | undefined {
  const now = new Date().toISOString();
  const slug = input.slug ?? generateSlug(input.date);
  const row = db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      date: input.date,
      excerpt: input.excerpt ?? "",
      content: input.content,
      published: input.published ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!row) return undefined;
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    content: row.content,
    published: row.published,
  };
}

/** 后台：更新文章（slug 不可改），不存在时返回 undefined */
export function updatePost(
  slug: string,
  input: Omit<PostInput, "slug">
): AdminPost | undefined {
  const row = db
    .update(posts)
    .set({
      title: input.title,
      date: input.date,
      excerpt: input.excerpt ?? "",
      content: input.content,
      published: input.published ?? true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.slug, slug))
    .returning()
    .get();

  if (!row) return undefined;
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    content: row.content,
    published: row.published,
  };
}

/** 后台：删除文章，返回是否删除成功 */
export function deletePost(slug: string): boolean {
  const result = db.delete(posts).where(eq(posts.slug, slug)).run();
  return result.changes > 0;
}
