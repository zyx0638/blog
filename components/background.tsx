"use client";

import { usePathname } from "next/navigation";

/**
 * mulberry32：确定性伪随机数生成器。
 *
 * 萤火虫/流星的位置必须在服务端与客户端得到完全相同的数值 —— 用 Math.random()
 * 生成会导致首屏 hydration 不匹配（服务端 HTML 与客户端首帧的坐标对不上）。
 * 换成固定种子的 PRNG 后，两端序列一致，且每次刷新布局稳定、不会乱跳。
 */
function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260910);

/** 允许在 style 里写 CSS 自定义属性的 React 样式类型 */
type StyleVars = React.CSSProperties & Record<`--${string}`, string>;

/** 萤火虫：暖黄绿光点，位置铺满视口，两层动画（漂移 + 明灭）的延迟各自错开 */
const FIREFLIES: StyleVars[] = Array.from({ length: 18 }, () => ({
  left: `${random() * 100}%`,
  top: `${random() * 100}%`,
  "--size": `${3 + random() * 4}px`,
  "--drift-x": `${(random() * 2 - 1) * 70}px`,
  "--drift-y": `${(random() * 2 - 1) * 70}px`,
  "--drift-duration": `${16 + random() * 18}s`,
  "--glow-duration": `${2.5 + random() * 3.5}s`,
  // 负延迟让动画从周期中途开始，避免所有光点同时亮灭
  "--drift-delay": `${-random() * 24}s`,
  "--glow-delay": `${-random() * 6}s`,
}));

/**
 * 流星：锁在屏幕上方 1/6 内向左划过，周期内大部分时间不可见（见 meteor-fly 关键帧）。
 *
 * 垂直跨度 = 起点 top + 飞行下沉 --meteor-y（globals.css）+ 拖尾自身下沉（长度 × sin(170°)）
 *          ≈ 4% + 7vh + 4vh ≈ 15%，小于 1/6（≈16.7%）。
 * 调大 --meteor-y 或这里的 top 系数都会让流星往下溢出这条带子，两者要一起改。
 */
const METEORS: StyleVars[] = Array.from({ length: 4 }, (_, i) => ({
  left: `${25 + random() * 65}%`,
  top: `${random() * 4}%`,
  "--meteor-length": `${90 + random() * 80}px`,
  "--meteor-duration": `${11 + random() * 7}s`,
  "--meteor-delay": `${i * 6 + random() * 7}s`,
}));

/**
 * 前台背景容器：博客前台显示 .site-bg 背景图与 .site-fx 夏夜特效层，
 * 管理端（/admin）保持纯深色、不加载任何特效。
 *
 * isolate 不可省略：它让本容器成为层叠上下文，.site-fx 的 z-index: -10
 * 才会停在"背景图之上、内容之下"。去掉它，负 z-index 会逃逸到根层叠上下文，
 * 被 .site-bg 的背景图整个盖住。
 */
export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <div
      className={`isolate flex min-h-screen flex-col${
        isAdmin ? "" : " site-bg"
      }`}
    >
      {!isAdmin && (
        // 纯装饰层：对读屏隐藏，且 pointer-events: none 不拦截点击
        <div className="site-fx" aria-hidden="true">
          {FIREFLIES.map((style, i) => (
            <span key={`f${i}`} className="firefly-track" style={style}>
              <span className="firefly" />
            </span>
          ))}
          {METEORS.map((style, i) => (
            <span key={`m${i}`} className="meteor-track" style={style}>
              <span className="meteor" />
            </span>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
