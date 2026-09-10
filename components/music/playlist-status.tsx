"use client";

/** 歌单非就绪态：加载中 / 未配置 / 加载失败 / 歌单为空（与左卡同布局，避免页面跳动） */
export default function PlaylistStatus({
  state,
  errorMessage,
  onRetry,
}: {
  state: "loading" | "not-configured" | "error" | "empty";
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const message = (() => {
    switch (state) {
      case "loading":
        return "歌单加载中…";
      case "not-configured":
        return "未配置歌单，请在 lib/site.ts 设置 musicPlaylistId";
      case "error":
        return errorMessage || "歌单加载失败";
      case "empty":
        return "歌单为空";
    }
  })();

  return (
    <section className="glass flex flex-col items-center justify-center gap-4 rounded-2xl p-6">
      {state === "loading" && (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"
          aria-hidden="true"
        />
      )}
      <p className="max-w-xs text-center text-sm text-gray-400">{message}</p>
      {state === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300"
        >
          重试
        </button>
      )}
    </section>
  );
}
