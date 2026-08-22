import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function PostList() {
  const posts = getAllPosts();

  return (
    <ul className="flex flex-col gap-8">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`} className="group block">
            <h2 className="text-xl font-semibold group-hover:underline">
              {post.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{post.date}</p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {post.excerpt}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
