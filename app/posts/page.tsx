import PostList from "@/components/post-list";

export const metadata = {
  title: "文章",
};

export default function PostsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        文章
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
      </h1>
      <PostList />
    </div>
  );
}
