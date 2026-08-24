import Link from "next/link";
import DeletePostButton from "@/components/admin/delete-post-button";
import { getAllPostsAdmin } from "@/lib/posts";

export const metadata = {
  title: "文章管理",
};

export default function AdminPostsPage() {
  const posts = getAllPostsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-black shadow-md shadow-orange-500/30 transition-colors hover:bg-orange-400"
        >
          + 新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-gray-500">
          还没有文章，点右上角「新建文章」开始写第一篇吧
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="glass flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="block truncate text-lg font-bold transition-colors hover:text-orange-400"
                >
                  {post.title}
                </Link>
                <p className="font-crt mt-1 text-sm text-gray-500">
                  {post.date} · {post.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {post.published ? (
                  <span className="font-crt rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-400">
                    已发布
                  </span>
                ) : (
                  <span className="font-crt rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs text-gray-400">
                    草稿
                  </span>
                )}
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="rounded-full px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  编辑
                </Link>
                <DeletePostButton slug={post.slug} title={post.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
