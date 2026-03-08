"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 邮箱验证等回调页：Supabase 会带着 hash (#access_token=...&refresh_token=...) 跳转至此，
 * hash 不会发到服务器，必须在此用客户端解析并 setSession，再跳转。
 */
function parseHashParams(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hash || !hash.startsWith("#")) return out;
  const query = hash.slice(1);
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1));
    if (key) out[key] = value;
  }
  return out;
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("正在登录…");

  useEffect(() => {
    let cancelled = false;
    const next = searchParams.get("next") ?? "/chat";

    (async () => {
      if (typeof window === "undefined") return;
      const hashParams = parseHashParams(window.location.hash);
      const access_token =
        hashParams.access_token ?? searchParams.get("access_token") ?? null;
      const refresh_token =
        hashParams.refresh_token ?? searchParams.get("refresh_token") ?? null;

      if (access_token && refresh_token) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setMessage(error.message || "登录失败");
            return;
          }
          setStatus("ok");
          setMessage("登录成功，正在跳转…");
          window.history.replaceState(null, "", window.location.pathname);
          window.location.href = next;
        } catch (e) {
          if (cancelled) return;
          setStatus("error");
          setMessage(e instanceof Error ? e.message : "登录失败");
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        setMessage("正在验证…");
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setMessage(error.message || "验证失败");
            return;
          }
          setStatus("ok");
          setMessage("登录成功，正在跳转…");
          window.location.href = next;
        } catch (e) {
          if (cancelled) return;
          setStatus("error");
          setMessage(e instanceof Error ? e.message : "验证失败");
        }
        return;
      }

      if (cancelled) return;
      setStatus("error");
      setMessage(
        "未收到登录信息。请从邮件中直接点击链接打开（勿复制链接）；若仍报错，请在 Supabase 控制台 Authentication → URL Configuration 中添加 Redirect URL：http://localhost:3000/auth/callback"
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        {status === "loading" && (
          <p className="text-[15px] text-muted-foreground">{message}</p>
        )}
        {status === "ok" && (
          <p className="text-[15px] text-foreground">{message}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-[15px] text-destructive">{message}</p>
            <a
              href="/login"
              className="inline-block rounded-[var(--radius)] bg-primary px-4 py-2 text-[15px] font-medium text-primary-foreground"
            >
              返回登录
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><p className="text-[15px] text-muted-foreground">正在加载…</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
