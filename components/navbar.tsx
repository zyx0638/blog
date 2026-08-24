"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章" },
  { href: "/moments", label: "一些碎碎念" },
  { href: "/gallery", label: "照片墙" },
  { href: "/projects", label: "项目" },
  { href: "/hobbies", label: "爱好" },
  { href: "/about", label: "关于" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [crtOn, setCrtOn] = useState(true);

  // 挂载时恢复用户的 CRT 偏好
  useEffect(() => {
    if (localStorage.getItem("crt") === "off") {
      document.documentElement.classList.add("crt-off");
      setCrtOn(false);
    }
  }, []);

  const toggleCrt = () => {
    const next = !crtOn;
    setCrtOn(next);
    document.documentElement.classList.toggle("crt-off", !next);
    localStorage.setItem("crt", next ? "on" : "off");
  };

  const activeLinkClass =
    "bg-orange-500 font-medium text-black shadow-md shadow-orange-500/30";
  const inactiveLinkClass = "text-gray-400 hover:bg-white/10 hover:text-white";

  const pillLinkClass = (href: string) =>
    `rounded-full px-3 py-1.5 text-base transition-colors ${
      isActivePath(pathname, href) ? activeLinkClass : inactiveLinkClass
    }`;

  const menuLinkClass = (href: string) =>
    `block rounded-xl px-3 py-2 text-base transition-colors ${
      isActivePath(pathname, href) ? activeLinkClass : inactiveLinkClass
    }`;

  return (
    <header className="sticky top-0 z-50">
      {/* 玻璃条铺满屏幕边缘，无外边距；内容仍居中与正文对齐 */}
      <div className="glass">
        <div className="flex w-full items-center justify-between py-3 pl-7 pr-5 sm:pl-12 sm:pr-8">
          <Link
            href="/"
            className="bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-2xl font-bold text-transparent"
          >
            {siteConfig.name}
          </Link>

          <div className="flex items-center gap-2">
            {/* 桌面端导航 */}
            <nav className="hidden gap-1 sm:flex" aria-label="主导航">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pillLinkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {/* CRT 效果开关 */}
            <button
              type="button"
              onClick={toggleCrt}
              aria-pressed={crtOn}
              title={crtOn ? "关闭 CRT 效果" : "开启 CRT 效果"}
              className={`font-crt rounded-full px-2.5 py-1 text-base leading-none transition-colors ${
                crtOn
                  ? "bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.35)]"
                  : "text-gray-500 hover:bg-white/10 hover:text-white"
              }`}
            >
              CRT
            </button>

            {/* 移动端汉堡按钮 */}
            <button
              type="button"
              aria-label={open ? "关闭菜单" : "打开菜单"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
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
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <nav
          className="glass mx-auto mt-2 max-w-2xl rounded-2xl px-4 py-3 sm:hidden"
          aria-label="移动端导航"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={menuLinkClass(item.href)}
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
