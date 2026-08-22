"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 96;

/**
 * 复古 LED 电平表：模拟老式音响的 VU 表跳动（纯装饰背景，无真实音频输入）
 * 动画直接写 style，不触发 React 重渲染；尊重 prefers-reduced-motion
 */
export default function AudioVisualizer() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const peakRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // 减弱动态效果设置下：只设一次静态高度，不做动画
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const level = 0.2 + ((i * 37) % 61) / 100; // 确定性伪随机
        bar.style.transform = `scaleY(${level})`;
        const peak = peakRefs.current[i];
        if (peak) peak.style.bottom = `${level * 100}%`;
      });
      return;
    }

    const levels = Array.from({ length: BAR_COUNT }, () => 0.3);
    const targets = Array.from({ length: BAR_COUNT }, () => 0.5);
    const nextRoll = Array.from({ length: BAR_COUNT }, () => 0);
    const peaks = Array.from({ length: BAR_COUNT }, () => 0.3);

    let frame = 0;
    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      frame++;
      if (frame % 2 !== 0) return; // 隔帧更新 ≈30fps，省一半计算

      const t = now / 1000;
      // 共享节拍：约 2Hz 正弦 + 慢速包络，让整排条有"跟着音乐起伏"的感觉
      const beat =
        0.7 +
        0.2 * Math.sin(2 * Math.PI * (t / 0.5)) +
        0.1 * Math.sin(2 * Math.PI * (t / 2.7));

      for (let i = 0; i < BAR_COUNT; i++) {
        // 每 90–150ms 重掷一次目标值（随机游走）
        if (t >= nextRoll[i]) {
          targets[i] = 0.15 + Math.random() * 0.8;
          nextRoll[i] = t + 0.09 + Math.random() * 0.06;
        }
        // level 向目标缓动，峰值保持并缓慢回落（经典 VU 表行为）
        levels[i] += (targets[i] * beat - levels[i]) * 0.15;
        peaks[i] = Math.max(levels[i], peaks[i] - 0.004);

        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleY(${levels[i]})`;
        const peak = peakRefs.current[i];
        if (peak) peak.style.bottom = `${peaks[i] * 100}%`;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      aria-hidden
      className="crt-vu pointer-events-none absolute inset-x-0 bottom-4 flex items-end justify-center gap-[2px] opacity-60 sm:gap-1.5"
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div key={i} className="relative h-16 w-0.5 sm:h-24 sm:w-1">
          <div
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="crt-vu-bar h-full w-full origin-bottom"
            style={{ transform: "scaleY(0.3)" }}
          />
          <div
            ref={(el) => {
              peakRefs.current[i] = el;
            }}
            className="crt-vu-peak absolute left-0 h-0.5 w-full"
            style={{ bottom: "30%" }}
          />
        </div>
      ))}
    </div>
  );
}
