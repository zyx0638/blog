"use client";

import { useEffect, useState } from "react";

interface LightboxPhoto {
  src: string;
  caption: string;
}

/** 照片网格 + 点击放大灯箱（Esc / 点击遮罩关闭） */
export default function GalleryLightbox({
  photos,
}: {
  photos: LightboxPhoto[];
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  const current = active !== null ? photos[active] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <figure key={i} className="group overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={() => setActive(i)}
              className="block w-full"
              aria-label={`查看图片：${photo.caption || i + 1}`}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
            {photo.caption && (
              <figcaption className="font-crt mt-1.5 text-center text-sm text-gray-400">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={current.src}
            alt={current.caption}
            referrerPolicy="no-referrer"
            className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
          {current.caption && (
            <p className="font-crt mt-4 text-center text-lg text-orange-300">
              {current.caption}
            </p>
          )}
          <button
            type="button"
            onClick={() => setActive(null)}
            className="font-crt absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
          >
            关闭
          </button>
        </div>
      )}
    </>
  );
}
