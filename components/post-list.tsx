import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function PostList() {
  const posts = getAllPosts();

  return (
    <ol className="grid gap-5 md:grid-cols-2">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/posts/${post.slug}`}
            className="glass group block h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
          >
            {post.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover}
                alt=""
                className="mb-4 h-44 w-full rounded-xl object-cover"
              />
            )}
            <h2 className="text-xl font-bold transition-colors group-hover:text-gray-300">
              {post.title}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">{post.date}</p>
            <p className="mt-3 text-gray-400">{post.excerpt}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
