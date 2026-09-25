import Link from "next/link";

const links = [
  { href: "/posts", label: "文章", detail: "阅读最近发布的内容" },
  { href: "/moments", label: "说说", detail: "一些简短的日常记录" },
  { href: "/projects", label: "项目", detail: "正在做和已经完成的事" },
  { href: "/music", label: "音乐", detail: "打开我的歌单" },
];

export default function QuickLinksCard() {
  return (
    <nav
      aria-label="快速访问"
      className="glass  min-h-[280px] rounded-2xl p-6 sm:p-8"
    >
      <h2 className="text-xl font-bold text-white">快速访问</h2>
      <div className="mt-4 divide-y divide-white/10">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-4 py-3 first:pt-1"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-200 transition-colors group-hover:text-white">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {item.detail}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-white"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
