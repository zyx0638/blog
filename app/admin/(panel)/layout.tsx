import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/admin/logout-button";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * 管理后台面板布局：未登录一律跳转登录页。
 * 登录页放在 (panel) 路由组之外，避免重定向死循环；URL 不受影响。
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    redirect("/admin/login");// 跳转登录页
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="glass mb-8 flex items-center justify-between rounded-2xl px-5 py-3">
        <nav className="flex items-center gap-1" aria-label="后台导航">
          <Link
            href="/admin/posts"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            文章管理
          </Link>
          <Link
            href="/admin/moments"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            说说
          </Link>
          <Link
            href="/admin/gallery"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            照片墙
          </Link>
          <Link
            href="/admin/anime"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            番剧
          </Link>
          <Link
            href="/admin/about"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            关于
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {session.username}
          </span>
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            返回博客
          </Link>
          <LogoutButton />
        </div>
      </div>

      {children}
    </div>
  );
}
