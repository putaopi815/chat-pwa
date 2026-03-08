"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

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
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isDark ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none block size-5 rounded-full shadow-sm ring-0 transition-transform ${
            isDark ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-primary"
          }`}
        />
      </button>
    </div>
  );
}
