import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 根据对方 user id 获取或创建单聊会话。
 * - 请求头带 Accept: application/json 时返回 JSON { conversationId }，供前端 fetch 后跳转。
 * - 否则 302 跳转到 /chat/[conversationId]。
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function wantsJson(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

export async function GET(request: NextRequest) {
  const otherUserId =
    request.nextUrl.searchParams.get("otherUserId") ??
    request.nextUrl.searchParams.get("otherUserid");
  const trimmed = otherUserId?.trim();
  const returnJson = wantsJson(request);

  if (!trimmed || !UUID_REGEX.test(trimmed)) {
    if (returnJson) return NextResponse.json({ error: "缺少或无效的 otherUserId" }, { status: 400 });
    return NextResponse.redirect(new URL("/contacts", request.url), 302);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (returnJson) return NextResponse.json({ error: "未登录" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url), 302);
  }
  if (trimmed === user.id) {
    if (returnJson) return NextResponse.json({ error: "不能与自己对话" }, { status: 400 });
    return NextResponse.redirect(new URL("/chat", request.url), 302);
  }

  const { data: convId, error } = await supabase.rpc("get_or_create_single_conversation", {
    other_user_id: trimmed,
  });

  if (error) {
    console.error("[get-or-create] RPC error:", error);
    if (returnJson) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.redirect(new URL("/contacts", request.url), 302);
  }

  let rawId = "";
  if (convId != null) {
    if (typeof convId === "string") {
      rawId = convId.trim();
    } else if (typeof convId === "object" && convId !== null && "id" in convId) {
      rawId = String((convId as { id?: unknown }).id ?? "").trim();
    } else if (typeof convId === "object" && convId !== null && "conversation_id" in convId) {
      rawId = String((convId as { conversation_id?: unknown }).conversation_id ?? "").trim();
    } else {
      rawId = String(convId).trim();
    }
  }
  const id = UUID_REGEX.test(rawId) ? rawId : "";
  if (!id) {
    if (returnJson) return NextResponse.json({ error: "未获取到会话" }, { status: 500 });
    return NextResponse.redirect(new URL("/chat", request.url), 302);
  }

  if (returnJson) {
    return NextResponse.json({ conversationId: id });
  }
  const chatUrl = new URL(`/chat/${id}`, request.url);
  return NextResponse.redirect(chatUrl, 302);
}
