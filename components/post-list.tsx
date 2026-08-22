import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function PostList() {
  const posts = getAllPosts();

  return (
    <ol className="flex flex-col gap-5">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/posts/${post.slug}`}
            className="glass group block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/20"
          >
            <h2 className="crt-glow text-xl font-bold transition-colors group-hover:text-orange-400">
              {post.title}
            </h2>
            <p className="font-crt mt-1.5 text-sm text-gray-500">{post.date}</p>
            <p className="mt-3 text-gray-400">{post.excerpt}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
