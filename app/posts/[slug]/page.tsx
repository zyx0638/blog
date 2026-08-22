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
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <time className="mt-2 block text-sm text-gray-500">{post.date}</time>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 返回首页
        </Link>
      </div>
    </article>
  );
}
