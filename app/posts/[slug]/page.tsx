import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

interface PostPageProps {
  params: { slug: string };
}

/** 预生成所有文章页面 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default function PostPage({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl px-6">
      <header className="mb-8">
        <h1 className="crt-aberration text-3xl font-bold sm:text-4xl">
          {post.title}
        </h1>
        <time className="font-crt mt-3 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
          {post.date}
        </time>
      </header>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="prose max-w-none prose-invert prose-a:text-orange-400 prose-headings:scroll-mt-24">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          ← 返回首页
        </Link>
      </div>
    </article>
  );
}
