import MomentList from "@/components/moment-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "说说",
};

export default function MomentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        说说
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>
      <MomentList />
    </div>
  );
}
