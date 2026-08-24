import Link from "next/link";
import { getAllPhotoGroups } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "照片墙",
};

export default function GalleryPage() {
  const groups = getAllPhotoGroups();

  return (
    <div className="mx-auto max-w-4xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        照片墙
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
      </h1>

      {groups.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="font-crt text-xl text-gray-400">还没有照片，敬请期待…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/gallery/${group.id}`}
              className="glass group block overflow-hidden rounded-2xl transition-colors hover:border-orange-500/50"
            >
              {group.cover ? (
                <img
                  src={group.cover}
                  alt={group.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-black/40">
                  <span className="font-crt text-gray-600">暂无照片</span>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-bold transition-colors group-hover:text-orange-400">
                  {group.title}
                </h2>
                {group.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                    {group.description}
                  </p>
                )}
                <p className="font-crt mt-2 text-sm text-orange-400">
                  {group.photoCount} 张照片
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
