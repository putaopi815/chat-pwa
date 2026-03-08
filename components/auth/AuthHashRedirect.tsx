"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 若当前 URL 带验证 hash (#access_token=...)，说明用户从邮件点进了错误页面（如首页），
 * 将带 hash 重定向到 /auth/callback 统一处理登录。
 */
function getHashParams(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hash || !hash.startsWith("#")) return out;
  for (const part of hash.slice(1).split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1));
    if (key) out[key] = value;
  }
  return out;
}

export function AuthHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || pathname === "/auth/callback") return;
    const params = getHashParams(window.location.hash);
    if (params.access_token && params.refresh_token) {
      window.location.replace(`/auth/callback${window.location.hash}`);
    }
  }, [pathname]);

  return null;
}
