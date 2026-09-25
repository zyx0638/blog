import Link from "next/link";
import type { PhotoGroup } from "@/lib/gallery";

export default function GalleryPreviewCard({
  group,
}: {
  group?: PhotoGroup;
}) {
  if (!group || group.previews.length === 0) {
    return (
      <section className="glass flex min-h-[360px] flex-col justify-between rounded-2xl p-6 sm:p-8">
        <div>
          <p className="text-sm text-gray-500">照片墙</p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            留住值得回看的瞬间
          </h2>
          <p className="mt-3 leading-7 text-gray-400">
            照片还在整理中，可以先看看项目和日常记录。
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link
            href="/projects"
            className="text-gray-300 transition-colors hover:text-white"
          >
            浏览项目 →
          </Link>
          <Link
            href="/moments"
            className="text-gray-400 transition-colors hover:text-white"
          >
            查看说说
          </Link>
        </div>
      </section>
    );
  }

  const cover = group.previews[0];

  return (
    <Link
      href={`/gallery/${group.id}`}
      className="glass group relative flex min-h-[360px] h-full overflow-hidden rounded-2xl"
    >
      {/* 第一张照片铺满整张卡片，底部渐变保证文字清晰可读。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt={group.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

      <div className="relative mt-auto flex w-full items-end justify-between gap-5 p-6 sm:p-7">
        <div className="min-w-0">
          <p className="text-xs text-gray-300/80">照片墙</p>
          <h2 className="mt-1 truncate text-xl font-bold text-white">
            {group.title}
          </h2>
          {group.description && (
            <p className="mt-2 line-clamp-1 text-sm text-gray-200/80">
              {group.description}
            </p>
          )}
        </div>
        <p className="shrink-0 text-sm text-gray-200/70">
          {group.photoCount} 张 →
        </p>
      </div>
    </Link>
  );
}
