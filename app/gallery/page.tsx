import Link from "next/link";
import { getAllPhotoGroups } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "照片墙",
};

/**
 * 扇形堆叠的层样式：第 0 层（组内首图）正面居中且不动，后两层绕底边中心左右展开成扇形，
 * 悬停时角度从 ±6° 散开到 ±12°。所有层共用 origin-bottom，像手里捻开的一叠相片。
 *
 * 角度上限受列宽约束：12° 时相片角横向溢出 57px，而照片框只占列宽 70%（左右各留 62px），
 * 再大就会叠到相邻的一列上。上下溢出由容器的 pt-7 / pb-9 留出。
 */
const STACK_LAYERS = [
  "z-30",
  "z-20 -rotate-6 group-hover/stack:-rotate-12",
  "z-10 rotate-6 group-hover/stack:rotate-12",
];

export default function GalleryPage() {
  const groups = getAllPhotoGroups();

  return (
    /*可在此处修改相片组大小*/
    <div className="mx-auto max-w-6xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        照片墙
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>

      {groups.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="text-xl text-gray-400">还没有照片，敬请期待…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/gallery/${group.id}`}
              className="group block"
            >
              {group.previews.length === 0 ? (
                <div className="mx-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
                  <span className="text-gray-600">暂无照片</span>
                </div>
              ) : (
                // pt-7 / pb-9 给扇形溢出留空间：悬停时相片上沿会顶出 24px、下沿沉下 30px
                <div className="group/stack pt-7 pb-9">
                  <div className="relative mx-auto aspect-square w-[70%]">
                    {group.previews.map((src, i) => (
                      <div
                        key={i}
                        className={`absolute inset-0 origin-bottom rounded-[3px] bg-white p-2 pb-7 shadow-xl shadow-black/40 transition-transform duration-300 ease-out ${
                          STACK_LAYERS[i]
                        }`}
                      >
                        <img
                          src={src}
                          alt={i === 0 ? group.title : ""}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full rounded-[2px] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center">
                <h2 className="text-lg font-bold transition-colors group-hover:text-gray-300">
                  {group.title}
                </h2>
                {group.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                    {group.description}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-gray-500">
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
