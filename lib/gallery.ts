import { asc, desc, eq } from "drizzle-orm";
import { galleryPhotos, photoGroups } from "@/db/schema";
import { db } from "@/lib/db";

export interface GalleryPhoto {
  id: number;
  src: string;
  caption: string;
}

/** 公开的照片组类型：封面取组内第一张图（插入顺序），无图时为 null */
export interface PhotoGroup {
  id: number;
  title: string;
  description: string;
  photoCount: number;
  cover: string | null;
}

/** 后台使用的照片组类型：公开字段 + 组内全部图片 */
export interface AdminPhotoGroup extends PhotoGroup {
  photos: GalleryPhoto[];
}

export interface PhotoGroupInput {
  title: string;
  description?: string;
}

const groupFields = {
  id: photoGroups.id,
  title: photoGroups.title,
  description: photoGroups.description,
};

const photoFields = {
  id: galleryPhotos.id,
  src: galleryPhotos.src,
  caption: galleryPhotos.caption,
};

interface PhotoGroupRow {
  id: number;
  title: string;
  description: string;
}

/** 一次查询加载全部组与照片（组内按插入顺序），避免 N+1 */
function loadGroupsWithPhotos(): {
  rows: PhotoGroupRow[];
  photosByGroup: Map<number, GalleryPhoto[]>;
} {
  const rows = db
    .select(groupFields)
    .from(photoGroups)
    .orderBy(desc(photoGroups.id))
    .all();
  const photos = db
    .select({ ...photoFields, groupId: galleryPhotos.groupId })
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.id))
    .all();
  const photosByGroup = new Map<number, GalleryPhoto[]>();
  for (const p of photos) {
    const list = photosByGroup.get(p.groupId) ?? [];
    list.push({ id: p.id, src: p.src, caption: p.caption });
    photosByGroup.set(p.groupId, list);
  }
  return { rows, photosByGroup };
}

function toPhotoGroup(row: PhotoGroupRow, photos: GalleryPhoto[]): PhotoGroup {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoCount: photos.length,
    cover: photos[0]?.src ?? null,
  };
}

/** 读取所有图片组（新组在前），封面与照片数随组计算 */
export function getAllPhotoGroups(): PhotoGroup[] {
  const { rows, photosByGroup } = loadGroupsWithPhotos();
  return rows.map((row) =>
    toPhotoGroup(row, photosByGroup.get(row.id) ?? [])
  );
}

/** 按 id 读取图片组及组内照片，不存在时返回 undefined */
export function getPhotoGroupById(
  id: number
): { group: PhotoGroup; photos: GalleryPhoto[] } | undefined {
  const row = db
    .select(groupFields)
    .from(photoGroups)
    .where(eq(photoGroups.id, id))
    .get();
  if (!row) return undefined;
  const photos = db
    .select(photoFields)
    .from(galleryPhotos)
    .where(eq(galleryPhotos.groupId, id))
    .orderBy(asc(galleryPhotos.id))
    .all();
  return { group: toPhotoGroup(row, photos), photos };
}

/** 后台：读取所有图片组（含组内全部图片） */
export function getAllPhotoGroupsAdmin(): AdminPhotoGroup[] {
  const { rows, photosByGroup } = loadGroupsWithPhotos();
  return rows.map((row) => ({
    ...toPhotoGroup(row, photosByGroup.get(row.id) ?? []),
    photos: photosByGroup.get(row.id) ?? [],
  }));
}

/** 后台：新建图片组 */
export function createPhotoGroup(input: PhotoGroupInput): AdminPhotoGroup {
  const now = new Date().toISOString();
  const row = db
    .insert(photoGroups)
    .values({
      title: input.title,
      description: input.description ?? "",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoCount: 0,
    cover: null,
    photos: [],
  };
}

/** 后台：更新图片组，不存在时返回 undefined */
export function updatePhotoGroup(
  id: number,
  input: PhotoGroupInput
): PhotoGroup | undefined {
  const row = db
    .update(photoGroups)
    .set({
      title: input.title,
      description: input.description ?? "",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(photoGroups.id, id))
    .returning()
    .get();

  if (!row) return undefined;
  const photos = db
    .select(photoFields)
    .from(galleryPhotos)
    .where(eq(galleryPhotos.groupId, id))
    .orderBy(asc(galleryPhotos.id))
    .all();
  return toPhotoGroup(row, photos);
}

/** 后台：删除图片组，返回被删图片的 src 列表（供调用方清理磁盘文件）；组不存在返回 null */
export function deletePhotoGroup(id: number): string[] | null {
  const exists = db
    .select({ id: photoGroups.id })
    .from(photoGroups)
    .where(eq(photoGroups.id, id))
    .get();
  if (!exists) return null;
  // SQLite 未开启外键级联，先删图片再删组，包在事务里保证原子性
  return db.transaction((tx) => {
    const photos = tx
      .select({ src: galleryPhotos.src })
      .from(galleryPhotos)
      .where(eq(galleryPhotos.groupId, id))
      .all();
    tx.delete(galleryPhotos).where(eq(galleryPhotos.groupId, id)).run();
    tx.delete(photoGroups).where(eq(photoGroups.id, id)).run();
    return photos.map((p) => p.src);
  });
}

export interface PhotoInput {
  src: string;
  caption?: string;
}

/** 后台：组内添加图片，组不存在时返回 undefined */
export function addPhoto(
  groupId: number,
  input: PhotoInput
): GalleryPhoto | undefined {
  const group = db
    .select({ id: photoGroups.id })
    .from(photoGroups)
    .where(eq(photoGroups.id, groupId))
    .get();
  if (!group) return undefined;

  const row = db
    .insert(galleryPhotos)
    .values({
      groupId,
      src: input.src,
      caption: input.caption ?? "",
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  return { id: row.id, src: row.src, caption: row.caption };
}

/** 后台：删除单张图片，返回其 src（供调用方清理磁盘文件）；不存在时返回 null */
export function deletePhoto(photoId: number): string | null {
  const row = db
    .delete(galleryPhotos)
    .where(eq(galleryPhotos.id, photoId))
    .returning({ src: galleryPhotos.src })
    .get();
  return row?.src ?? null;
}
