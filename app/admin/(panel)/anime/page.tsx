import AnimeManager from "@/components/admin/anime-manager";

export const metadata = {
  title: "番剧管理",
};

export default function AdminAnimePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">番剧管理</h1>
      <AnimeManager />
    </div>
  );
}
