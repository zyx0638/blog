import PostEditor from "@/components/admin/post-editor";

export const metadata = {
  title: "编辑文章",
};

export default function EditPostPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">编辑文章</h1>
      <div className="glass rounded-2xl p-6 sm:p-8">
        <PostEditor slug={params.slug} />
      </div>
    </div>
  );
}
