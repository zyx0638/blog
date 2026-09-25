import Link from "next/link";
import type { PhotoGroup } from "@/lib/gallery";

export default function GalleryPreviewCard({
  group,
}: {
  group?: PhotoGroup;
}) {
  if (!group || group.previews.length === 0) {
    return (
      <section className="glass flex min-h-[360px]  flex-col justify-between rounded-2xl p-6 sm:p-8">
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

  const [cover, second, third] = group.previews;

  return (
    <Link
      href={`/gallery/${group.id}`}
      className="glass group flex min-h-[360px] h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="grid h-56 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-2 gap-1 overflow-hidden bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={group.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
            second ? "row-span-2" : "col-span-2 row-span-2"
          }`}
        />
        {second && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={second}
            alt=""
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              third ? "" : "row-span-2"
            }`}
          />
        )}
        {third && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={third}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="flex flex-1 items-end justify-between gap-5 p-6">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">照片墙</p>
          <h2 className="mt-1 truncate text-xl font-bold text-white">
            {group.title}
          </h2>
          {group.description && (
            <p className="mt-2 line-clamp-1 text-sm text-gray-400">
              {group.description}
            </p>
          )}
        </div>
        <p className="shrink-0 text-sm text-gray-500">
          {group.photoCount} 张 →
        </p>
      </div>
    </Link>
  );
}
