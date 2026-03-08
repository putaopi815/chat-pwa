import Link from "next/link";

export interface PageHeaderProps {
  title: string;
  /** 右侧插槽，如「+ 添加」 */
  rightSlot?: React.ReactNode;
  /** 返回链接，有则显示「‹ 返回」 */
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  rightSlot,
  backHref,
  backLabel = "返回",
}: PageHeaderProps) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_2fr_1fr] items-center gap-2 border-b border-border bg-card px-3 shadow-sm">
      <div className="flex min-w-0 items-center justify-start">
        {backHref ? (
          <Link
            href={backHref}
            className="flex size-10 items-center justify-center text-primary hover:opacity-80"
            aria-label={backLabel}
          >
            <span className="text-[2em] leading-none" style={{ fontFamily: "system-ui" }} aria-hidden>
              ‹
            </span>
          </Link>
        ) : null}
      </div>
      <h1 className="min-w-0 truncate text-center text-xl font-semibold text-card-foreground tracking-tight">
        {title}
      </h1>
      <div className="flex min-w-0 items-center justify-end">{rightSlot ?? null}</div>
    </header>
  );
}
