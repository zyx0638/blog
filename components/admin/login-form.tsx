"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">用户名</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-400">密码</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-300 disabled:opacity-50"
      >
        {loading ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
