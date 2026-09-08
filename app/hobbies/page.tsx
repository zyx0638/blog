import { getAllAnime } from "@/lib/anime";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "爱好",
};

export default function HobbiesPage() {
  const animeList = getAllAnime();

  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        爱好
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>

      {/* 喜欢的番剧 */}
      <h2 className="mb-4 text-xl font-bold text-gray-200">喜欢的番剧</h2>
      {animeList.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="text-xl text-gray-400">还没有添加番剧，敬请期待…</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {animeList.map((item) => (
            <div key={item.bangumiId} className="glass overflow-hidden rounded-2xl">
              {item.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cover}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center bg-black/40">
                  <span className="text-gray-600">暂无封面</span>
                </div>
              )}
              <div className="p-3">
                <h3 className="truncate text-sm font-bold" title={item.title}>
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 其它爱好占位 */}
    </div>
  );
}
