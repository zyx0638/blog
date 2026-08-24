"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
    >
      退出登录
    </button>
  );
}
