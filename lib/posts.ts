import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "posts");

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

function parsePostFile(fileName: string): Post {
  const slug = fileName.replace(/\.md$/, "");
  const fileContents = fs.readFileSync(
    path.join(postsDirectory, fileName),
    "utf8"
  );
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    content,
  };
}

/** 读取所有文章，按日期倒序排列 */
export function getAllPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map(parsePostFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 按 slug 读取单篇文章，不存在时返回 undefined */
export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}
