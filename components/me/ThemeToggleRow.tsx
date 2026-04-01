"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggleRow() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-t-[var(--radius-lg)] transition-colors hover:bg-accent/50">
      <span className="text-base font-medium text-foreground">主题</span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "切换到亮色" : "切换到暗色"}
        onClick={toggleTheme}
        className={cn(
          "relative h-7 w-12 shrink-0 cursor-pointer rounded-full border border-border transition-colors motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDark ? "bg-primary" : "bg-muted"
        )}
      >
        {/* 绝对定位滑块，避免 inline-flex 子项在部分环境下不可见 */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-[3px] block h-[22px] w-[22px] -translate-y-1/2 rounded-full border border-border/80 bg-card shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
            isDark ? "translate-x-[22px]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
