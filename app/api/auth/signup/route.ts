import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 服务端注册：转发到 Supabase 并返回完整错误信息，便于前端展示 422 等具体原因。
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少需要 6 位，请重试。" }, { status: 422 });
  }

  const supabase = createClient(url, anonKey);
  const redirectTo = request.nextUrl.origin + "/auth/callback";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    // 开发环境：在终端打印完整错误，便于排查
    if (process.env.NODE_ENV === "development") {
      console.error("[signup] Supabase 原始错误:", error.message, "\nname:", error.name);
    }
    // 网络/连接类错误：提示检查配置与网络
    const isNetworkError =
      msg.includes("fetch failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound");
    const userMessage = isNetworkError
      ? "无法连接认证服务，请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY（可尝试使用 Legacy anon key），或稍后重试。"
      : msg.includes("password") && (msg.includes("6") || msg.includes("length"))
        ? "密码至少需要 6 位，请重试。"
        : msg.includes("email") && (msg.includes("invalid") || msg.includes("format"))
          ? "邮箱格式不正确，请检查后重试。"
          : msg.includes("already") || msg.includes("already registered")
            ? "该邮箱已注册，请直接登录。"
            : error.message;
    const status = msg.includes("already") ? 409 : isNetworkError ? 502 : 422;
    return NextResponse.json({ error: userMessage }, { status });
  }

  if (data.user && !data.session) {
    return NextResponse.json({
      ok: true,
      needConfirm: true,
      message: "注册成功，请查收邮件完成验证后登录。",
    });
  }

  return NextResponse.json({ ok: true, user: data.user?.id });
}
