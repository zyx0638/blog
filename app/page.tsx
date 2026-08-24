import PostList from "@/components/post-list";
import { siteConfig } from "@/lib/site";

// 文章存数据库，按请求渲染，保证后台发布后立即生效
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="crt-gradient-aberration bg-gradient-to-r from-orange-500 via-amber-400 to-red-400 bg-clip-text text-transparent">
            {siteConfig.name}
          </span>
        </h1>
        <p className="mt-3 text-gray-400">{siteConfig.description}</p>
      </section>

      <PostList />
    </div>
  );
}
