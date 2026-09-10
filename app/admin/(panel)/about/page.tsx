import AboutManager from "@/components/admin/about-manager";

export const metadata = {
  title: "关于管理",
};

export default function AdminAboutPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">关于管理</h1>
      <AboutManager />
    </div>
  );
}
