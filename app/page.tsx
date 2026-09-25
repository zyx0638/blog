import FeaturedContentCard from "@/components/home/featured-content-card";
import GalleryPreviewCard from "@/components/home/gallery-preview-card";
import ProfileCard from "@/components/home/profile-card";
import QuickLinksCard from "@/components/home/quick-links-card";
import { getAbout } from "@/lib/about";
import { getAllPhotoGroups } from "@/lib/gallery";
import { getAllMoments } from "@/lib/moments";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

// 首页内容来自数据库，后台更新后应立即反映到前台。
export const dynamic = "force-dynamic";

export default function Home() {
  const about = getAbout();
  const posts = getAllPosts();
  const moments = getAllMoments();
  const photoGroups = getAllPhotoGroups();
  const photoCount = photoGroups.reduce(
    (total, group) => total + group.photoCount,
    0
  );
  const featuredPhotoGroup =
    photoGroups.find((group) => group.previews.length > 0) ?? photoGroups[0];

  return (
    <div className="mx-auto max-w-6xl px-6">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="mt-3 text-gray-400">{siteConfig.description}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-6">
          <ProfileCard
            about={about}
            postCount={posts.length}
            momentCount={moments.length}
            photoCount={photoCount}
          />
        </div>

        <div className="lg:col-span-6">
          <QuickLinksCard />
        </div>

        <div className="lg:col-span-6">
          <FeaturedContentCard post={posts[0]} moment={moments[0]} />
        </div>

        <div className="lg:col-span-6">
          <GalleryPreviewCard group={featuredPhotoGroup} />
        </div>
      </div>
    </div>
  );
}
