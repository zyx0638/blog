import MomentsManager from "@/components/admin/moments-manager";

export const metadata = {
  title: "说说管理",
};

export default function AdminMomentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">说说管理</h1>
      <MomentsManager />
    </div>
  );
}
