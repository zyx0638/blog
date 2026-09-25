import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Moment } from "@/lib/moments";
import type { Post } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

interface FeaturedContentCardProps {
  post?: Post;
  moment?: Moment;
}

export default function FeaturedContentCard({
  post,
  moment,
}: FeaturedContentCardProps) {
  if (post) {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className="glass group relative flex min-h-[360px]  overflow-hidden rounded-2xl"
      >
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div
          className={`absolute inset-0 ${
            post.cover
              ? "bg-gradient-to-t from-black via-black/55 to-black/10"
              : "bg-black/15"
          }`}
        />
        <div className="relative mt-auto w-full p-6 sm:p-8">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-medium uppercase tracking-wider text-gray-300">
              最新文章
            </span>
            <span>{post.date}</span>
          </div>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 line-clamp-2 max-w-2xl leading-7 text-gray-300">
              {post.excerpt}
            </p>
          )}
          <p className="mt-5 text-sm text-gray-300 transition-colors group-hover:text-white">
            阅读全文 →
          </p>
        </div>
      </Link>
    );
  }

  if (moment) {
    return (
      <Link
        href="/moments"
        className="glass group flex min-h-[360px] h-full flex-col rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-gray-300">最近的说说</p>
          <time className="text-xs text-gray-500">{moment.date}</time>
        </div>
        <div className="my-8 flex flex-1 items-center">
          <div className="prose prose-lg max-h-40 max-w-none overflow-hidden prose-invert prose-headings:my-2 prose-p:my-2 prose-p:text-gray-300 prose-a:text-gray-200 prose-img:hidden">
            <ReactMarkdown>{moment.content}</ReactMarkdown>
          </div>
        </div>
        <p className="text-sm text-gray-400 transition-colors group-hover:text-white">
          查看更多说说 →
        </p>
      </Link>
    );
  }

  return (
    <section className="glass flex min-h-[360px] h-full flex-col justify-end rounded-2xl p-6 sm:p-8">
      <p className="text-sm text-gray-500">欢迎来到</p>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
        {siteConfig.name}
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-gray-400">
        {siteConfig.description}
      </p>
      <Link
        href="/about"
        className="mt-6 text-sm text-gray-300 transition-colors hover:text-white"
      >
        了解更多 →
      </Link>
    </section>
  );
}
