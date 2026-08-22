import PostList from "@/components/post-list";

export const metadata = {
  title: "文章",
};

export default function PostsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-2xl font-bold">文章</h1>
      <PostList />
    </div>
  );
}
