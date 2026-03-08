"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/chat";

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("请先输入邮箱");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setForgotLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        ...(redirectTo && { redirectTo }),
      });
      if (resetError) throw resetError;
      setSuccessMessage("重置邮件已发送，请查收。点击邮件中的链接设置新密码后，即可用新密码登录。");
      setForgotPassword(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送失败，请稍后重试");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    setError(null);
    setResendLoading(true);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        ...(redirectTo && { options: { emailRedirectTo: redirectTo } }),
      });
      if (resendError) throw resendError;
      setSuccessMessage("验证邮件已重新发送，请查收。");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送失败，请稍后重试");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        let signupRes: Response;
        try {
          signupRes = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
          });
        } catch {
          setError("注册请求失败，请检查网络后重试。");
          setLoading(false);
          return;
        }
        try {
          const rawBody = await signupRes.text();
          let data: { error?: string; ok?: boolean; needConfirm?: boolean; message?: string } = {};
          try {
            if (rawBody) data = JSON.parse(rawBody);
          } catch {
            /* 非 JSON 时保留 data 为空 */
          }
          const apiError = typeof data?.error === "string" ? data.error : "";
          if (signupRes.status === 409) {
            setIsRegister(false);
            setSuccessMessage("该邮箱已注册，请直接输入密码后点击「登录」。");
            setLoading(false);
            return;
          }
          if (!signupRes.ok) {
            const fallback =
              signupRes.status === 422
                ? "注册未通过校验，请确认密码至少 6 位、邮箱格式正确。"
                : "注册失败，请重试。";
            setError(apiError || fallback);
            setLoading(false);
            return;
          }
          if (data.needConfirm) {
            setSuccessMessage(data.message || "注册成功，请查收邮件完成验证后登录。");
            setLoading(false);
            return;
          }
          if (data.ok) {
            await new Promise((r) => setTimeout(r, 300));
            window.location.assign(redirect);
            return;
          }
          setError(apiError || "注册失败，请重试。");
        } catch (_) {
          const fallback =
            signupRes.status === 422
              ? "注册未通过校验，请确认密码至少 6 位、邮箱格式正确。"
              : "注册请求失败，请检查网络后重试。";
          setError(fallback);
        }
        setLoading(false);
        return;
      } else {
        let res: Response;
        try {
          res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              password,
              redirect,
            }),
            redirect: "follow",
            credentials: "same-origin",
          });
        } catch (fetchErr) {
          setError("网络错误，请检查网络后重试。");
          setLoading(false);
          return;
        }
        if (res.redirected && res.ok) {
          window.location.href = redirect;
          return;
        }
        if (!res.ok) {
          const fallback401 =
            "邮箱或密码错误，或该账号尚未完成邮箱验证。若曾通过邮件重置密码，请使用当时设置的新密码；或点击下方「忘记密码？」重新设置。";
          let apiError = res.status === 401 ? fallback401 : "登录失败，请重试。";
          try {
            const text = await res.text();
            const parsed = text ? JSON.parse(text) : {};
            if (typeof (parsed as { error?: string }).error === "string") {
              apiError = (parsed as { error: string }).error;
            } else if (res.status === 401) {
              apiError = fallback401;
            }
          } catch {
            apiError = res.status === 401 ? fallback401 : "登录失败，请重试。";
          }
          setError(apiError);
          setLoading(false);
          return;
        }
        const location = res.headers.get("Location");
        window.location.href = location || redirect;
        return;
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "操作失败，请重试";
      const lower = raw.toLowerCase();
      const isNetworkError =
        lower.includes("fetch") && (lower.includes("fail") || lower.includes("error")) ||
        lower.includes("failed to fetch") ||
        lower.includes("network");
      const message =
        lower.includes("rate limit") || lower.includes("rate_limit")
          ? "发送邮件过于频繁，请约 1 小时后再试，或在 Supabase 中配置自定义 SMTP。"
          : isNetworkError
            ? "网络错误，请检查网络后重试。若为注册/登录接口 4xx，请确认密码至少 6 位、邮箱格式正确。"
            : lower.includes("invalid login") || lower.includes("invalid_credentials")
              ? "邮箱或密码错误，或该账号尚未完成邮箱验证。"
              : raw;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-8">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3.5">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-black">
            <img
              src="/icons/icon-512.png"
              alt=""
              className="h-full w-full rounded-[20px] object-cover"
              width={72}
              height={72}
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">轻聊</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form id="auth-form" onSubmit={handleSubmit} className="space-y-3" noValidate>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                autoComplete="email"
                className="h-12 text-[15px]"
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "请设置密码（至少 6 位）" : "请输入密码"}
                  required
                  minLength={6}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className="h-12 pr-11 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <Eye className="size-5" aria-hidden />
                  ) : (
                    <EyeOff className="size-5" aria-hidden />
                  )}
                </button>
              </div>
              {!isRegister && !forgotPassword && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 text-sm text-primary"
                    onClick={() => {
                      setForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                  >
                    忘记密码？
                  </Button>
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {successMessage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{successMessage}</p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading || !email.trim()}
                  >
                    {resendLoading ? "发送中…" : "没收到？重新发送验证邮件"}
                  </Button>
                </div>
              )}
              {forgotPassword ? (
                <div className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-4">
                  <p className="text-sm text-foreground">
                    将向 <strong>{email || "上面填写的邮箱"}</strong> 发送重置链接，请查收邮件并点击链接设置新密码。
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setForgotPassword(false);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading || !email.trim()}
                    >
                      {forgotLoading ? "发送中…" : "发送重置邮件"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full text-base"
                >
                  {loading ? "请稍候…" : isRegister ? "注册" : "登录"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        {!forgotPassword && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => {
              setIsRegister((v) => !v);
              setError(null);
              setSuccessMessage(null);
            }}
          >
            {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          登录即表示你同意《用户协议》与《隐私政策》
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><p className="text-[15px] text-muted-foreground">加载中…</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
