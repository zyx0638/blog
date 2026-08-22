import MomentList from "@/components/moment-list";

export const metadata = {
  title: "一些碎碎念",
};

export default function MomentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        一些碎碎念
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
      </h1>
      <MomentList />
    </div>
  );
}
