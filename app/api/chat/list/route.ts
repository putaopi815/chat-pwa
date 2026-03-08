import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_AVATAR_COLORS = ["#C8D4FF", "#FFD9C5", "#CFEED8", "#E8D5F2", "#D4E4FF", "#FFE5C8"];
const FALLBACK_NICKNAME = "用户";

export type ChatListRow = {
  id: string;
  otherUserId: string;
  initialNickname: string;
  avatarColor: string;
  /** 对方用户头像 URL（在「我的」页选择的默认头像），有则全局展示 */
  avatarUrl?: string | null;
  summary: string;
  time: string;
  unreadCount: number;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const myId = user.id;

  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", myId);
  const conversationIds = (myMemberships ?? []).map((r) => r.conversation_id);

  if (conversationIds.length === 0) {
    return NextResponse.json({
      rows: [],
      conversationIds: [],
      otherUserIds: [],
    });
  }

  // 与聊天详情页一致：用 RPC 取对方 user_id（并行请求）
  const otherUserIdByConv = new Map<string, string>();
  const rpcResults = await Promise.all(
    conversationIds.map((cid) =>
      supabase.rpc("get_other_conversation_member", { conv_id: cid }).then((r) => ({ cid, otherId: r.data }))
    )
  );
  for (const { cid, otherId } of rpcResults) {
    if (typeof otherId === "string") otherUserIdByConv.set(cid, otherId);
  }

  const otherUserIds = [...new Set(otherUserIdByConv.values())];

  const nicknameByUserId = new Map<string, string>();
  const avatarUrlByUserId = new Map<string, string | null>();
  if (otherUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", otherUserIds);
    for (const p of profiles ?? []) {
      nicknameByUserId.set(p.id, p.display_name?.trim() || FALLBACK_NICKNAME);
      avatarUrlByUserId.set(p.id, p.avatar_url?.trim() || null);
    }
    for (const uid of otherUserIds) {
      if (!nicknameByUserId.has(uid)) nicknameByUserId.set(uid, FALLBACK_NICKNAME);
    }
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, is_cleared_for_all, last_message_preview, last_message_at")
    .in("id", conversationIds);
  const convMap = new Map(conversations?.map((c) => [c.id, c]) ?? []);

  const { data: unreadRows } = await supabase.rpc("get_conversation_unread_counts");
  const unreadByConv = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    const r = row as { conversation_id: string; unread_count: number };
    if (r.conversation_id && r.unread_count > 0) {
      unreadByConv.set(r.conversation_id, Number(r.unread_count));
    }
  }

  const rows: ChatListRow[] = [];
  for (const conversationId of conversationIds) {
    const conv = convMap.get(conversationId);
    const otherId = otherUserIdByConv.get(conversationId)!;
    const nickname = nicknameByUserId.get(otherId) ?? FALLBACK_NICKNAME;
    const avatarUrl = avatarUrlByUserId.get(otherId) ?? null;
    const colorIndex = conversationIds.indexOf(conversationId) % DEFAULT_AVATAR_COLORS.length;
    const avatarColor = DEFAULT_AVATAR_COLORS[colorIndex];

    const { data: message } = await supabase
      .from("messages")
      .select("id, content, status, sender_id, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let summary: string;
    /** 最后一条消息的 ISO 时间戳，由客户端按本地时区格式化，避免服务端 UTC 导致列表时间错误 */
    const time = message?.created_at ?? "";

    if (!message) {
      summary = conv?.is_cleared_for_all ? "聊天记录已清空" : "";
    } else {
      if (message.status === "recalled") {
        summary = message.sender_id === myId ? "你撤回了一条消息" : "对方撤回了一条消息";
      } else if (message.status === "purged_for_all") {
        summary = "聊天记录已清空";
      } else {
        summary = message.content ?? "";
      }
    }

    rows.push({
      id: conversationId,
      otherUserId: otherId,
      initialNickname: nickname,
      avatarColor,
      avatarUrl: avatarUrl || undefined,
      summary,
      time,
      unreadCount: unreadByConv.get(conversationId) ?? 0,
    });
  }

  rows.sort((a, b) => {
    const aTime = convMap.get(a.id)?.last_message_at ?? "";
    const bTime = convMap.get(b.id)?.last_message_at ?? "";
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json({
    rows,
    conversationIds,
    otherUserIds,
  });
}
