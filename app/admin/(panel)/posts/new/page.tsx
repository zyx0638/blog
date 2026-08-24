import PostEditor from "@/components/admin/post-editor";

export const metadata = {
  title: "新建文章",
};

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">新建文章</h1>
      <div className="glass rounded-2xl p-6 sm:p-8">
        <PostEditor />
      </div>
    </div>
  );
}
