/** 播放器内联 SVG 图标集：与全站图标风格一致（stroke currentColor） */

interface IconProps {
  size?: number;
  className?: string;
}

function IconBase({
  size = 20,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function PrevIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 5v14" />
      <path d="M20 5l-10 7 10 7V5z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 5v14" />
      <path d="M4 5l10 7-10 7V5z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** 列表循环 */
export function RepeatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 01-4 4H3" />
    </IconBase>
  );
}

/** 单曲循环 */
export function RepeatOneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 01-4 4H3" />
      <path d="M11 10h1v4" fill="none" />
      <path d="M10 10h1.5" />
    </IconBase>
  );
}

/** 随机播放 */
export function ShuffleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </IconBase>
  );
}
