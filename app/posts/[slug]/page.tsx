import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPostBySlug } from "@/lib/posts";

// 文章存数据库，按请求渲染，删除静态预生成
export const dynamic = "force-dynamic";

interface PostPageProps {
  params: { slug: string };
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
    <article className="mx-auto -my-8 flex min-h-[calc(100dvh-72px)] max-w-2xl flex-col px-6">
      {/* 顶部间距 16px（-my-8 抵消 main 的 py-12 间距），仅本页生效；
          min-h = 视口高 - 卡片顶部偏移（导航栏 56 + py-top 48 - mt 32 = 72），
          短文章时卡片底部贴齐屏幕最底部 */}
      <div className="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt={post.title}
            className="aspect-[16/9] w-full object-cover"
          />
        )}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
          <time className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
            {post.date}
          </time>
          <div className="prose max-w-none prose-invert prose-a:text-gray-200 prose-headings:scroll-mt-24 mt-8">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
}
