import MomentList from "@/components/moment-list";

export const metadata = {
  title: "一些碎碎念",
};

export default function MomentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-2xl font-bold">一些碎碎念</h1>
      <MomentList />
    </div>
  );
}
