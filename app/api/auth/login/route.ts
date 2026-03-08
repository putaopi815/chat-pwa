import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 服务端登录：在响应中写入 Session Cookie 后 302 跳转，避免前端 Cookie 写入时机问题。
 */
export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "服务未配置" }, { status: 500 });
    }

    let body: { email?: string; password?: string; redirect?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体无效" }, { status: 400 });
    }
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const redirectTo = typeof body.redirect === "string" && body.redirect ? body.redirect : "/chat";
    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    const redirectUrl = new URL(redirectTo, request.url);
    const response = NextResponse.redirect(redirectUrl, 302);

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[login] Supabase 原始错误:", error.message);
      }
      const msg = error.message.toLowerCase();
      const userMessage =
        msg.includes("invalid login") || msg.includes("invalid_credentials")
          ? "邮箱或密码错误，或该账号尚未完成邮箱验证。"
          : msg.includes("email not confirmed") ||
            msg.includes("email_not_confirmed") ||
            msg.includes("confirm") ||
            msg.includes("unconfirmed")
            ? "请先到注册邮箱点击验证链接完成验证后再登录。"
            : error.message;
      return NextResponse.json({ error: userMessage }, { status: 401 });
    }
    if (!data.session) {
      return NextResponse.json(
        {
          error:
            "登录成功但未建立会话，请先到注册邮箱点击验证链接完成验证后再登录；或在 Supabase 控制台关闭「Confirm email」后重试。",
        },
        { status: 401 }
      );
    }

    return response;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[login] 未捕获错误:", err);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "登录失败，请重试。" },
      { status: 500 }
    );
  }
}
