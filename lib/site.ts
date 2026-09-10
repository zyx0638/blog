export interface SiteConfig {
  name: string;
  description: string;
  /** QQ 音乐歌单 ID（y.qq.com 歌单链接末尾的数字），留空则音乐页显示未配置提示 */
  musicPlaylistId: string;
}

/** 站点全局信息：导航栏、SEO 元信息、页脚等统一从这里读取 */
export const siteConfig: SiteConfig = {
  name: "欢迎来到轩神的lab",
  description: "一个用 Next.js 14 + Tailwind CSS 搭建的个人博客",
  musicPlaylistId: "9331772488",
};
