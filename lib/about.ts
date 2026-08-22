import fs from "fs";
import path from "path";

const aboutFile = path.join(process.cwd(), "content", "about.md");

export interface About {
  content: string;
}

/** 读取「关于」页的内容（content/about.md 全文），文件不存在时返回空内容 */
export function getAbout(): About {
  const content = fs.existsSync(aboutFile)
    ? fs.readFileSync(aboutFile, "utf8")
    : "";
  return { content };
}
