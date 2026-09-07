"use client";

import { usePathname } from "next/navigation";

/**
 * 前台背景图容器：仅博客前台显示 .site-bg 背景，管理端（/admin）保持纯深色。
 * 管理端布局为 force-dynamic，SSR 时 pathname 已有值，不会产生 hydration 不匹配。
 */
export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <div className={`flex min-h-screen flex-col${isAdmin ? "" : " site-bg"}`}>
      {children}
    </div>
  );
}
