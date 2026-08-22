"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章" },
  { href: "/moments", label: "一些碎碎念" },
  { href: "/about", label: "关于" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const desktopLinkClass = (href: string) =>
    `text-sm transition-colors hover:text-foreground ${
      isActivePath(pathname, href)
        ? "font-semibold text-foreground"
        : "text-gray-500"
    }`;

  const mobileLinkClass = (href: string) =>
    `block rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800 ${
      isActivePath(pathname, href)
        ? "font-semibold text-foreground"
        : "text-gray-500"
    }`;

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold">
          {siteConfig.name}
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden gap-6 sm:flex" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={desktopLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 移动端汉堡按钮 */}
        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:text-foreground dark:border-gray-800 sm:hidden"
        >
          {open ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          )}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <nav
          className="border-t border-gray-200 px-6 py-3 dark:border-gray-800 sm:hidden"
          aria-label="移动端导航"
        >
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={mobileLinkClass(item.href)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
