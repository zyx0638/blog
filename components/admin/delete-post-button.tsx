"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-gray-500">删除「{title}」？</span>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-500"
        >
          删除
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10"
        >
          取消
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-full px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
    >
      删除
    </button>
  );
}
