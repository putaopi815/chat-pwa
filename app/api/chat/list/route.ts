import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_AVATAR_COLORS = ["#C8D4FF", "#FFD9C5", "#CFEED8", "#E8D5F2", "#D4E4FF", "#FFE5C8"];
const FALLBACK_NICKNAME = "用户";

type LastMessage = {
  id: string;
  content: string | null;
  status: "normal" | "recalled" | "purged_for_all";
  sender_id: string;
  created_at: string;
};

type ConversationWithLastMessage = {
  id: string;
  is_cleared_for_all: boolean;
  last_message_preview: string | null;
  last_message_at: string | null;
  messages?: LastMessage[] | null;
};

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

function getSummary(
  conversation: Pick<ConversationWithLastMessage, "is_cleared_for_all" | "last_message_preview">,
  lastMessage: LastMessage | undefined,
  myId: string
): string {
  if (conversation.is_cleared_for_all) return "聊天记录已清空";
  if (!lastMessage) return conversation.last_message_preview ?? "";
  if (lastMessage.status === "recalled") {
    return lastMessage.sender_id === myId ? "你撤回了一条消息" : "对方撤回了一条消息";
  }
  if (lastMessage.status === "purged_for_all") return "聊天记录已清空";
  return lastMessage.content ?? "";
}

async function fetchConversationsWithLastMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationIds: string[]
): Promise<ConversationWithLastMessage[]> {
  const embeddedResult = await supabase
    .from("conversations")
    .select("id, is_cleared_for_all, last_message_preview, last_message_at, messages(id, content, status, sender_id, created_at)")
    .in("id", conversationIds)
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" });

  if (!embeddedResult.error) {
    return (embeddedResult.data ?? []) as ConversationWithLastMessage[];
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[chat/list] 嵌套最后一条消息查询失败，回退为仅会话字段（last_message_preview / last_message_at）:",
      embeddedResult.error.message
    );
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, is_cleared_for_all, last_message_preview, last_message_at")
    .in("id", conversationIds);

  const fallbackConversations = ((conversations ?? []) as ConversationWithLastMessage[]).map((conversation) => ({
    ...conversation,
    messages: [],
  }));
  return fallbackConversations;
}

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

  const [membersResult, conversations, unreadRpc] = await Promise.all([
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds),
    fetchConversationsWithLastMessage(supabase, conversationIds),
    supabase.rpc("get_conversation_unread_counts"),
  ]);

  const allMembers = membersResult.data;
  const unreadRows = unreadRpc.data;

  // 单聊：同会话内除自己外的成员即为对方（一次查询，需 RLS 允许看同会话其他成员行）
  const otherUserIdByConv = new Map<string, string>();
  for (const m of allMembers ?? []) {
    if (m.user_id !== myId) {
      otherUserIdByConv.set(m.conversation_id, m.user_id);
    }
  }

  // 若库上仍是「只能 SELECT 自己的 conversation_members 行」旧策略，上面拿不到对方，列表会空；用 RPC 补齐
  const missingOther = conversationIds.filter((id) => !otherUserIdByConv.has(id));
  if (missingOther.length > 0) {
    const rpcResults = await Promise.all(
      missingOther.map((cid) =>
        supabase.rpc("get_other_conversation_member", { conv_id: cid }).then((r) => ({ cid, otherId: r.data }))
      )
    );
    for (const { cid, otherId } of rpcResults) {
      if (typeof otherId === "string") otherUserIdByConv.set(cid, otherId);
    }
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

  const convMap = new Map(conversations?.map((c) => [c.id, c]) ?? []);
  const unreadByConv = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    const r = row as { conversation_id: string; unread_count: number };
    if (r.conversation_id && r.unread_count > 0) {
      unreadByConv.set(r.conversation_id, Number(r.unread_count));
    }
  }

  const rows: ChatListRow[] = [];
  for (const [index, conversationId] of conversationIds.entries()) {
    const conv = convMap.get(conversationId);
    const otherId = otherUserIdByConv.get(conversationId);
    if (!otherId || !conv) continue;
    const nickname = nicknameByUserId.get(otherId) ?? FALLBACK_NICKNAME;
    const avatarUrl = avatarUrlByUserId.get(otherId) ?? null;
    const colorIndex = index % DEFAULT_AVATAR_COLORS.length;
    const avatarColor = DEFAULT_AVATAR_COLORS[colorIndex];
    const message = Array.isArray(conv.messages) ? conv.messages[0] : undefined;

    /** 最后一条消息的 ISO 时间戳，由客户端按本地时区格式化，避免服务端 UTC 导致列表时间错误 */
    const time = message?.created_at ?? conv.last_message_at ?? "";
    const summary = getSummary(conv, message, myId);

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
