import { eq } from "drizzle-orm";
import { about } from "@/db/schema";
import { db } from "@/lib/db";

export interface About {
  avatar: string;
  handle: string;
  content: string;
}

const aboutFields = {
  avatar: about.avatar,
  handle: about.handle,
  content: about.content,
};

/** 读取「关于」页信息（about 表单行 id=1），不存在时返回全空默认值 */
export function getAbout(): About {
  return (
    db.select(aboutFields).from(about).where(eq(about.id, 1)).get() ?? {
      avatar: "",
      handle: "",
      content: "",
    }
  );
}

export interface AboutInput {
  avatar: string;
  handle: string;
  content: string;
}

/** 后台：写入「关于」页信息（upsert 固定 id=1），返回更新后的内容 */
export function upsertAbout(input: AboutInput): About {
  const now = new Date().toISOString();
  const row = db
    .insert(about)
    .values({
      id: 1,
      avatar: input.avatar,
      handle: input.handle,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: about.id,
      set: {
        avatar: input.avatar,
        handle: input.handle,
        content: input.content,
        updatedAt: now,
      },
    })
    .returning(aboutFields)
    .get();

  return row;
}
