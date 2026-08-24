import GalleryManager from "@/components/admin/gallery-manager";

export const metadata = {
  title: "照片墙管理",
};

export default function AdminGalleryPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">照片墙管理</h1>
      <GalleryManager />
    </div>
  );
}
