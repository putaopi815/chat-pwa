export type AvatarSize = "sm" | "md" | "lg" | "xl" | "list";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-[88px] w-[88px]",
  xl: "h-16 w-16",
  list: "h-12 w-12",
};

/** 圆角：full 正圆，lg 16px，xl 12px，md 8px */
export type AvatarRounded = "full" | "lg" | "xl" | "md";

const roundedClasses: Record<AvatarRounded, string> = {
  full: "rounded-full",
  lg: "rounded-[16px]",
  xl: "rounded-[12px]",
  md: "rounded-[8px]",
};

export interface AvatarProps {
  /** 背景色，如 #C8D4FF（无图片时的纯色圆） */
  color: string;
  /** 头像图片 URL，有则优先显示图片 */
  avatarUrl?: string | null;
  size?: AvatarSize;
  /** 圆角，默认 full */
  rounded?: AvatarRounded;
  className?: string;
}

export function Avatar({
  color,
  avatarUrl,
  size = "md",
  rounded = "full",
  className = "",
}: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const roundedClass = roundedClasses[rounded];
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`aspect-square max-w-full shrink-0 ${roundedClass} object-cover ${sizeClass} ${className}`}
        aria-hidden
      />
    );
  }
  return (
    <div
      className={`shrink-0 ${roundedClass} ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
