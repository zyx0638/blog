import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/navbar";
import AudioVisualizer from "@/components/audio-visualizer";
import { siteConfig } from "@/lib/site";
import "@fontsource/vt323";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          {/* 背景层：视频 → 余烬光斑 → 整块磨砂玻璃 → VU 电平表 */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
          >
            {/* 背景视频：public/videos 下的本地文件 */}
            <video
              className="crt-bg-video absolute inset-0 h-full w-full object-cover"
              src="/videos/Stein%20Gate%20-%20Makise%20Kurisu%20Divergence%20meter%20Cybust%20-%20PC.mp4"
              autoPlay
              muted
              loop
              playsInline
            />

            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-orange-600/15 blur-3xl" />
            <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />

            {/* 整块磨砂玻璃：视频透过它变成柔和流动的色块 */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-lg" />

            {/* 复古 LED 电平表：位于玻璃之上，保持锐利 */}
            <AudioVisualizer />
          </div>

          {/* CRT 显像管效果层：滚动亮带 / 屏幕边框 */}
          <div aria-hidden className="crt-effects">
            <div className="crt-band" />
            <div className="crt-frame" />
          </div>

          <Navbar />

          <main className="flex-1 py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
