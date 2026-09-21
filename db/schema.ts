import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 文章表 */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO 日期字符串，如 "2026-08-22"
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull(),
  cover: text("cover").notNull().default(""), // 封面图路径（/uploads/xxx 或外部链接），空串表示无
  published: integer("published", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 说说表 */
export const moments = sqliteTable("moments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  cover: text("cover").notNull().default(""), // 封面图路径（/uploads/xxx 或外部链接），空串表示无
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 照片墙：图片组表 */
export const photoGroups = sqliteTable("photo_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 番剧表（数据来自 Bangumi） */
export const anime = sqliteTable("anime", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bangumiId: integer("bangumi_id").notNull().unique(), // Bangumi 条目 id，unique 防止重复添加
  title: text("title").notNull(), // 展示名：name_cn 优先，为空时用原名
  cover: text("cover").notNull().default(""), // 本地封面路径 /uploads/xxx，空串表示无封面
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 照片墙：组内图片表（src 为 /uploads/xxx 本地路径或外部 http(s) 链接） */
export const galleryPhotos = sqliteTable(
  "gallery_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groupId: integer("group_id")
      .notNull()
      .references(() => photoGroups.id), // 仅作文档用途：SQLite 未开启外键 pragma，级联删除靠代码事务
    src: text("src").notNull(),
    caption: text("caption").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("gallery_photos_group_idx").on(table.groupId)]
);

/** 管理员账号表 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

/** 关于页表：单行（固定 id=1），头像 / ID / 简介均由管理端维护 */
export const about = sqliteTable("about", {
  id: integer("id").primaryKey(), // 固定 1，单行表
  avatar: text("avatar").notNull().default(""), // 头像路径（/uploads/xxx），空串表示无
  handle: text("handle").notNull().default(""), // ID：头像右侧展示的昵称/账号名
  content: text("content").notNull().default(""), // 简介正文（Markdown）
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
