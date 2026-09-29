import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "blog.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbPath,
  },
});
