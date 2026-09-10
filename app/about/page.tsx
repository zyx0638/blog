import ReactMarkdown from "react-markdown";
import { getAbout } from "@/lib/about";

// 关于页内容存数据库，按请求渲染，管理端保存后立即生效
export const dynamic = "force-dynamic";

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  const about = getAbout();

  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        关于
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>

      <div className="glass rounded-2xl p-6 sm:p-8">
        {/* 头像（左）+ ID（右侧），均由管理端维护 */}
        <div className="flex items-center gap-5">
          {about.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={about.avatar}
              alt="头像"
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-3xl font-bold text-gray-300">
              {(about.handle || "关").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xl font-bold text-white">
              {about.handle || "还没有设置 ID"}
            </p>
          </div>
        </div>

        {about.content ? (
          <>
            <div className="my-6 h-px bg-white/10" />
            <div className="prose max-w-none prose-invert prose-a:text-gray-200">
              <ReactMarkdown>{about.content}</ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="mt-6 text-gray-500">还没有填写简介…</p>
        )}
      </div>
    </div>
  );
}
