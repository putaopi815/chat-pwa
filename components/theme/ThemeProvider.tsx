"use client";

import {
  createContext,
  useContext,
  useCallback,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

let storageListenerAttached = false;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (typeof window !== "undefined" && !storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === null) emit();
    });
  }
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyDomTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // 隐私模式等可能不可用
  }
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    applyDomTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    applyDomTheme(next);
    emit();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = getSnapshot() === "dark" ? "light" : "dark";
    applyDomTheme(next);
    emit();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark: theme === "dark",
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
