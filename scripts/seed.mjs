/**
 * 种子脚本（幂等）：导入 posts/ 和 moments/ 目录下的 markdown 文件到数据库，
 * 并在首次运行时用 ADMIN_PASSWORD 环境变量创建管理员账号。
 * 重复执行不会产生重复数据。
 *
 * 用法：先 npm run db:push 建表，再 npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

// 读取 .env.local（普通 node 脚本不会自动加载；不覆盖已存在的环境变量，Docker 环境直接用）
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const dbPath =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "blog.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

const postsTable = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
  .get();
if (!postsTable) {
  console.error("❌ 数据表不存在，请先运行 npm run db:push");
  process.exit(1);
}

const now = () => new Date().toISOString();

// ---------- 导入文章 ----------
const insertPost = db.prepare(`
  INSERT OR IGNORE INTO posts (slug, title, date, excerpt, content, published, created_at, updated_at)
  VALUES (@slug, @title, @date, @excerpt, @content, 1, @createdAt, @updatedAt)
`);

const postsDir = path.join(process.cwd(), "posts");
let postCount = 0;
if (fs.existsSync(postsDir)) {
  for (const file of fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(
      fs.readFileSync(path.join(postsDir, file), "utf8")
    );
    const timestamp = now();
    const result = insertPost.run({
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      excerpt: data.excerpt ?? "",
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (result.changes > 0) postCount++;
  }
}
console.log(`✅ 文章导入完成：新增 ${postCount} 篇`);

// ---------- 导入说说 ----------
const insertMoment = db.prepare(`
  INSERT OR IGNORE INTO moments (slug, date, content, created_at, updated_at)
  VALUES (@slug, @date, @content, @createdAt, @updatedAt)
`);

const momentsDir = path.join(process.cwd(), "moments");
let momentCount = 0;
if (fs.existsSync(momentsDir)) {
  for (const file of fs
    .readdirSync(momentsDir)
    .filter((f) => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(
      fs.readFileSync(path.join(momentsDir, file), "utf8")
    );
    const timestamp = now();
    const result = insertMoment.run({
      slug,
      date: data.date ?? "",
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (result.changes > 0) momentCount++;
  }
}
console.log(`✅ 说说导入完成：新增 ${momentCount} 条`);

// ---------- 创建管理员账号（仅首次） ----------
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (userCount === 0) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("❌ 首次初始化需要设置环境变量 ADMIN_PASSWORD");
    process.exit(1);
  }
  const username = process.env.ADMIN_USERNAME ?? "admin";
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    username,
    bcrypt.hashSync(password, 10)
  );
  console.log(`✅ 已创建管理员账号：${username}`);
} else {
  console.log("ℹ️ 管理员账号已存在，跳过创建");
}
