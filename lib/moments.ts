import { desc, eq } from "drizzle-orm";
import { moments } from "@/db/schema";
import { db } from "@/lib/db";

export interface Moment {
  slug: string;
  date: string;
  content: string;
  cover: string;
}

/** 后台使用的碎碎念类型：公开字段 + id */
export interface AdminMoment extends Moment {
  id: number;
}

const momentFields = {
  slug: moments.slug,
  date: moments.date,
  content: moments.content,
  cover: moments.cover,
};

const adminMomentFields = { id: moments.id, ...momentFields };

/** 读取所有碎碎念，按日期倒序排列 */
export function getAllMoments(): Moment[] {
  return db.select(momentFields).from(moments).orderBy(desc(moments.date)).all();
}

/** 后台：读取所有碎碎念（含 id），按日期倒序 */
export function getAllMomentsAdmin(): AdminMoment[] {
  return db
    .select(adminMomentFields)
    .from(moments)
    .orderBy(desc(moments.date))
    .all();
}

/** 后台：按 id 读取碎碎念，不存在时返回 undefined */
export function getMomentAdmin(id: number): AdminMoment | undefined {
  return db
    .select(adminMomentFields)
    .from(moments)
    .where(eq(moments.id, id))
    .get();
}

export interface MomentInput {
  date: string;
  content: string;
  cover?: string;
}

/** 后台：新建碎碎念，slug 自动生成 */
export function createMoment(input: MomentInput): AdminMoment | undefined {
  const now = new Date().toISOString();
  const row = db
    .insert(moments)
    .values({
      slug: `m-${now.replace(/\D/g, "")}`,
      date: input.date,
      content: input.content,
      cover: input.cover ?? "",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!row) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    date: row.date,
    content: row.content,
    cover: row.cover,
  };
}

/** 后台：更新碎碎念，不存在时返回 undefined */
export function updateMoment(
  id: number,
  input: MomentInput
): AdminMoment | undefined {
  const row = db
    .update(moments)
    .set({
      date: input.date,
      content: input.content,
      cover: input.cover ?? "",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(moments.id, id))
    .returning()
    .get();

  if (!row) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    date: row.date,
    content: row.content,
    cover: row.cover,
  };
}

/** 后台：删除碎碎念，返回是否删除成功 */
export function deleteMoment(id: number): boolean {
  const result = db.delete(moments).where(eq(moments.id, id)).run();
  return result.changes > 0;
}
