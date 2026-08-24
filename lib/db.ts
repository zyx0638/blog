import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

const dbPath =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "blog.db");

// SQLite 不会自动创建目录，先确保 data 目录存在
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// 用 globalThis 缓存连接，避免开发模式热更新时反复打开文件
const globalForDb = globalThis as unknown as {
  __sqlite?: InstanceType<typeof Database>;
};

const sqlite = globalForDb.__sqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

if (!globalForDb.__sqlite) {
  globalForDb.__sqlite = sqlite;
}

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
  schema,
});
