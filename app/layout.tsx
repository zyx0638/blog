import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/navbar";
import { siteConfig } from "@/lib/site";
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
          <Navbar />

          <main className="flex-1 py-12">{children}</main>

          <footer className="border-t border-gray-200 dark:border-gray-800">
            <div className="mx-auto max-w-2xl px-6 py-6 text-sm text-gray-500">
              © {new Date().getFullYear()} {siteConfig.name} · Built with Next.js
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
