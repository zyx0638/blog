export interface SiteConfig {
  name: string;
  description: string;
}

/** 站点全局信息：导航栏、SEO 元信息、页脚等统一从这里读取 */
export const siteConfig: SiteConfig = {
  name: "My Blog",
  description: "一个用 Next.js 14 + Tailwind CSS 搭建的个人博客",
};
