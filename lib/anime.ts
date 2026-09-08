import { asc, eq } from "drizzle-orm";
import { anime } from "@/db/schema";
import { db } from "@/lib/db";

export interface Anime {
  bangumiId: number;
  title: string;
  cover: string;
}

/** 后台使用的番剧类型：公开字段 + id */
export interface AdminAnime extends Anime {
  id: number;
}

const animeFields = {
  bangumiId: anime.bangumiId,
  title: anime.title,
  cover: anime.cover,
};

const adminAnimeFields = { id: anime.id, ...animeFields };

/** 读取所有番剧，按添加顺序（id 升序）排列 */
export function getAllAnime(): Anime[] {
  return db.select(animeFields).from(anime).orderBy(asc(anime.id)).all();
}

/** 后台：读取所有番剧（含 id），按添加顺序 */
export function getAllAnimeAdmin(): AdminAnime[] {
  return db.select(adminAnimeFields).from(anime).orderBy(asc(anime.id)).all();
}

/** 后台：按 id 读取番剧，不存在时返回 undefined */
export function getAnimeAdmin(id: number): AdminAnime | undefined {
  return db
    .select(adminAnimeFields)
    .from(anime)
    .where(eq(anime.id, id))
    .get();
}

/** 后台：按 Bangumi 条目 id 读取（重复添加预检查），不存在时返回 undefined */
export function getAnimeByBangumiId(bangumiId: number): AdminAnime | undefined {
  return db
    .select(adminAnimeFields)
    .from(anime)
    .where(eq(anime.bangumiId, bangumiId))
    .get();
}

export interface AnimeInput {
  bangumiId: number;
  title: string;
  cover: string;
}

/** 后台：新建番剧记录（bangumiId 重复时抛 SqliteError，调用方需先预检查） */
export function createAnime(input: AnimeInput): AdminAnime | undefined {
  const now = new Date().toISOString();
  const row = db
    .insert(anime)
    .values({
      bangumiId: input.bangumiId,
      title: input.title,
      cover: input.cover ?? "",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!row) return undefined;
  return {
    id: row.id,
    bangumiId: row.bangumiId,
    title: row.title,
    cover: row.cover,
  };
}

/** 后台：删除番剧，返回是否删除成功 */
export function deleteAnime(id: number): boolean {
  const result = db.delete(anime).where(eq(anime.id, id)).run();
  return result.changes > 0;
}
