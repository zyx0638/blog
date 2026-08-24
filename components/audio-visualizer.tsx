"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 192; // 铺满全宽后的条数（移动端隐藏奇数条，剩 96 根）
const SEGS = 12; // 离散 LED 段数（全断点统一，与 CSS 的 100%/12 tile 对应）
const ATTACK = 0.35; // 上升系数（快）
const DECAY = 0.07; // 回落系数（慢）
const PEAK_DECAY = 0.004; // peak 每帧回落 ≈0.12/s

/**
 * 复古 LED 电平表：模拟老式显像管电视/音响上的离散段 VU 表（纯装饰背景，无真实音频输入）
 * 段切分靠容器上的静态 track/mask 两层 + TS 侧把 level 量化到段网格；
 * 动画直接写 style，不触发 React 重渲染；尊重 prefers-reduced-motion
 */
export default function AudioVisualizer() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const peakRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // 减弱动态效果设置下：只设一次静态高度（同样量化到段网格）
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const band = 1 - i / (BAR_COUNT - 1); // 左强右弱，频谱形
        const raw = 0.12 + (((i * 37) % 61) / 100) * 0.55 + band * 0.3;
        const seg = Math.max(1, Math.min(SEGS, Math.floor(raw * SEGS)));
        bar.style.transform = `scaleY(${seg / SEGS})`;
        const peak = peakRefs.current[i];
        if (peak) peak.style.bottom = `${((Math.min(SEGS - 1, seg) / SEGS) * 100)}%`;
      });
      return;
    }

    const levels = new Float32Array(BAR_COUNT).fill(0.3);
    const targets = new Float32Array(BAR_COUNT).fill(0.5);
    const nextRoll = new Float32Array(BAR_COUNT);
    const peaks = new Float32Array(BAR_COUNT).fill(0.3);
    const smoothed = new Float32Array(BAR_COUNT);
    const lastSeg = new Int8Array(BAR_COUNT).fill(-1); // 段号变化才写 DOM
    const lastPeakSeg = new Int8Array(BAR_COUNT).fill(-1);
    const bandAmp = new Float32Array(BAR_COUNT); // 频带幅度
    const rollT = new Float32Array(BAR_COUNT); // 频带重掷间隔
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = i / (BAR_COUNT - 1);
      bandAmp[i] = 0.95 - 0.6 * x; // 左（低频）幅度大
      rollT[i] = 0.25 + 0.5 * x; // 左慢右快：0.25s → 0.75s
    }

    let frame = 0;
    let rafId = 0;
    let quietLevel = 1;
    let quietEnd = 0;
    let nextQuiet = 6 + Math.random() * 4; // 首次安静段落 6–10s 后

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      frame++;
      if (frame % 2 !== 0) return; // 隔帧更新 ≈30fps，省一半计算

      const t = now / 1000;

      // 安静段落调度：随机时刻出现 2–4.5s 的"停顿"，间隔 8–20s
      if (t >= nextQuiet && quietLevel > 0.05) {
        quietEnd = t + 2 + Math.random() * 2.5;
        nextQuiet = quietEnd + 8 + Math.random() * 12;
      }
      const quietTarget = t < quietEnd ? 0.22 : 1;
      quietLevel += (quietTarget - quietLevel) * 0.03; // ~0.5–1s 平滑进出

      // 全局包络：3 个互质频率 0.9/1.7/2.9 Hz 叠加，比单一正弦更有机
      const env =
        (0.62 +
          0.22 * Math.sin(2 * Math.PI * 0.9 * t) +
          0.12 * Math.sin(2 * Math.PI * 1.7 * t + 1.3) +
          0.07 * Math.sin(2 * Math.PI * 2.9 * t + 2.1)) *
        quietLevel;

      // 目标重掷 + 非对称 attack/decay
      for (let i = 0; i < BAR_COUNT; i++) {
        if (t >= nextRoll[i]) {
          targets[i] = 0.1 + Math.random() * (0.4 + 0.5 * bandAmp[i]);
          nextRoll[i] = t + rollT[i] + Math.random() * 0.15;
        }
        const target = targets[i] * env;
        levels[i] +=
          (target - levels[i]) * (target > levels[i] ? ATTACK : DECAY);
      }

      // 相邻 3 抽头平滑：整体呈频谱状而非独立噪声
      smoothed[0] = (levels[0] * 3 + levels[1]) / 4;
      smoothed[BAR_COUNT - 1] =
        (levels[BAR_COUNT - 1] * 3 + levels[BAR_COUNT - 2]) / 4;
      for (let i = 1; i < BAR_COUNT - 1; i++) {
        smoothed[i] = (levels[i - 1] + 2 * levels[i] + levels[i + 1]) / 4;
      }

      // 网格量化 + 门控老化闪烁 + 仅段变化时写 DOM
      for (let i = 0; i < BAR_COUNT; i++) {
        let seg = Math.floor(smoothed[i] * SEGS);
        // 门控突发闪烁：~20s 周期、约 10% 占空比内以 ~6Hz 掉一段
        // （朴素乘法在量化网格下要么全局抖动、要么永不触发）
        if (
          seg > 0 &&
          Math.sin(t * 0.31 + i * 3.1) > 0.95 &&
          Math.sin(t * 38 + i * 5.3) > 0.3
        ) {
          seg--;
        }
        if (seg !== lastSeg[i]) {
          lastSeg[i] = seg;
          const bar = barRefs.current[i];
          if (bar) bar.style.transform = `scaleY(${seg / SEGS})`;
        }

        // peak 保持 + 缓慢回落，位置量化到段网格并封顶防溢出
        peaks[i] = Math.max(smoothed[i], peaks[i] - PEAK_DECAY);
        const pSeg = Math.min(SEGS - 1, Math.floor(peaks[i] * SEGS));
        if (pSeg !== lastPeakSeg[i]) {
          lastPeakSeg[i] = pSeg;
          const peak = peakRefs.current[i];
          if (peak) peak.style.bottom = `${(pSeg / SEGS) * 100}%`;
        }
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      aria-hidden
      className="crt-vu pointer-events-none absolute inset-x-0 bottom-4 flex items-end gap-[2px] opacity-60 sm:gap-1.5 [--vu-gap:1px] sm:[--vu-gap:2px]"
    >
      {/* 轨道层：未点亮 LED 段点阵（静态，不随 scaleY 压缩） */}
      <div className="crt-vu-track absolute inset-0 z-0" />
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          className={`relative h-16 flex-1 sm:h-24 ${
            i % 2 === 1 ? "hidden sm:block" : ""
          }`}
        >
          <div
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="crt-vu-bar h-full w-full origin-bottom"
            style={{ transform: "scaleY(0.25)" }} // 初值对齐 3/12 段网格
          />
          <div
            ref={(el) => {
              peakRefs.current[i] = el;
            }}
            className="crt-vu-peak absolute left-0 w-full"
            style={{
              bottom: "25%",
              height: "calc(100% / 12 - var(--vu-gap, 1px))",
            }}
          />
        </div>
      ))}
      {/* 暗缝 mask：把 scaleY 后的 bar 切成离散段（静态，最上层） */}
      <div className="crt-vu-mask absolute inset-0 z-10" />
    </div>
  );
}
