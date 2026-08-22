import fs from "fs";
import path from "path";
import matter from "gray-matter";

const momentsDirectory = path.join(process.cwd(), "moments");

export interface Moment {
  slug: string;
  date: string;
  content: string;
}

function parseMomentFile(fileName: string): Moment {
  const slug = fileName.replace(/\.md$/, "");
  const fileContents = fs.readFileSync(
    path.join(momentsDirectory, fileName),
    "utf8"
  );
  const { data, content } = matter(fileContents);

  return {
    slug,
    date: data.date ?? "",
    content,
  };
}

/** 读取所有说说，按日期倒序排列；目录不存在时返回空列表 */
export function getAllMoments(): Moment[] {
  if (!fs.existsSync(momentsDirectory)) return [];

  const fileNames = fs.readdirSync(momentsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map(parseMomentFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
