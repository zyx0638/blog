import MusicPlayer from "@/components/music/music-player";

export const metadata = {
  title: "音乐",
};

export default function MusicPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        音乐
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>

      {/* 左卡固定 380px 播放控制区，右卡自适应；移动端上下堆叠 */}
      <div className="grid grid-cols-1 gap-6 lg:h-[520px] lg:grid-cols-[380px_minmax(0,1fr)]">
        <MusicPlayer />
      </div>
    </div>
  );
}
