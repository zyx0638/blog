import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryLightbox from "@/components/gallery-lightbox";
import { getPhotoGroupById } from "@/lib/gallery";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function generateMetadata({ params }: Params) {
  const data = getPhotoGroupById(Number(params.id));
  return { title: data ? data.group.title : "照片墙" };
}

export default function GalleryDetailPage({ params }: Params) {
  const data = getPhotoGroupById(Number(params.id));
  if (!data) notFound();

  const { group, photos } = data;

  return (
    <div className="mx-auto max-w-4xl px-6">
      <Link
        href="/gallery"
        className="mb-6 inline-block rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        ← 返回照片墙
      </Link>

      <h1 className="text-3xl font-bold">
        {group.title}
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
      </h1>

      {group.description && <p className="mt-4 text-gray-400">{group.description}</p>}
      <p className="font-crt mt-2 text-sm text-orange-400">
        {group.photoCount} 张照片
      </p>

      <div className="mt-8">
        {photos.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center text-gray-500">
            这个图片组还没有照片
          </p>
        ) : (
          <GalleryLightbox
            photos={photos.map((p) => ({ src: p.src, caption: p.caption }))}
          />
        )}
      </div>
    </div>
  );
}
