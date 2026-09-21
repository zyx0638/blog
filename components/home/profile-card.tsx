import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { About } from "@/lib/about";
import { siteConfig } from "@/lib/site";

interface ProfileCardProps {
  about: About;
  postCount: number;
  momentCount: number;
  photoCount: number;
}

export default function ProfileCard({
  about,
  postCount,
  momentCount,
  photoCount,
}: ProfileCardProps) {
  const displayName = about.handle || siteConfig.name;
  const stats = [
    { label: "文章", value: postCount },
    { label: "说说", value: momentCount },
    { label: "照片", value: photoCount },
  ];

  return (
    <section className="glass flex h-full min-h-[220px] flex-col rounded-2xl p-6 sm:p-7">
      <div className="flex items-start gap-5">
        {about.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={about.avatar}
            alt={`${displayName}的头像`}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-white/15 sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold text-gray-300 ring-1 ring-white/10 sm:h-20 sm:w-20">
            {displayName.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">关于我</p>
          <h2 className="mt-1 truncate text-2xl font-bold text-white sm:text-3xl">
            {displayName}
          </h2>
          {about.content ? (
            <div className="prose prose-sm mt-3 max-h-[4.5rem] max-w-none overflow-hidden text-gray-400 prose-headings:my-0 prose-headings:text-base prose-headings:text-gray-300 prose-p:my-0 prose-p:text-gray-400 prose-a:text-gray-300 prose-img:hidden">
              <ReactMarkdown>{about.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">
              {siteConfig.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-end justify-between gap-6">
          <dl className="flex min-w-0 flex-1 gap-7 sm:gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-2xl font-bold tabular-nums text-white">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs text-gray-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <Link
            href="/about"
            className="shrink-0 text-sm text-gray-400 transition-colors hover:text-white"
          >
            查看关于 →
          </Link>
        </div>
      </div>
    </section>
  );
}
