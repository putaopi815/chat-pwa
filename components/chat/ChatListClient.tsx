"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyContacts } from "@/lib/supabase/contacts";
import { Card, CardContent } from "@/components/ui/card";
import { formatMessageTime } from "@/lib/format-time";
import { ChatListRow, type ChatListRowItem } from "./ChatListRow";
import { ChatListRealtimeRefresher } from "./ChatListRealtimeRefresher";

const DEFAULT_AVATAR_COLORS = ["#C8D4FF", "#FFD9C5", "#CFEED8", "#E8D5F2", "#D4E4FF", "#FFE5C8"];
const FALLBACK_NICKNAME = "用户";

type ListRow = ChatListRowItem & { sortAt: string };

export function ChatListClient() {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const myId = user.id;

      const { data: myMemberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", myId);
    const conversationIds = (myMemberships ?? []).map((r) => r.conversation_id);
    if (conversationIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: allMembers } = await supabase
        .from("conversation_members")
        .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    const otherUserIdByConv = new Map<string, string>();
    for (const m of allMembers ?? []) {
      if (m.user_id !== myId) {
        otherUserIdByConv.set(m.conversation_id, m.user_id);
      }
    }

    // 先从通讯录取昵称（与通讯录页同源）；未加好友的对方再从 profiles 拉取
    const otherUserIds = [...new Set(otherUserIdByConv.values())];
    const contacts = await getMyContacts(supabase);
    const nicknameByUserId = new Map(contacts.map((c) => [c.id, c.nickname]));

    // 未加好友的对方：用与通讯录/详情页相同的单条查询逐条拉取，确保拿到真实昵称
    const missingIds = otherUserIds.filter((id) => !nicknameByUserId.has(id));
    for (const uid of missingIds) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", uid)
        .maybeSingle();
      nicknameByUserId.set(uid, data?.display_name?.trim() || FALLBACK_NICKNAME);
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

    const list: ListRow[] = [];
    for (const conversationId of conversationIds) {
      const conv = convMap.get(conversationId);
      const otherId = otherUserIdByConv.get(conversationId)!;
      const nickname = nicknameByUserId.get(otherId) ?? FALLBACK_NICKNAME;
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
      let time: string;
      let sortAt: string;
      if (!message) {
        summary = conv?.is_cleared_for_all ? "聊天记录已清空" : "";
        time = "—";
        sortAt = conv?.last_message_at ?? "";
      } else {
        if (message.status === "recalled") {
          summary =
            message.sender_id === myId ? "你撤回了一条消息" : "对方撤回了一条消息";
        } else if (message.status === "purged_for_all") {
          summary = "聊天记录已清空";
        } else {
          summary = message.content ?? "";
        }
        time = formatMessageTime(message.created_at);
        sortAt = message.created_at;
      }

      list.push({
        id: conversationId,
        otherUserId: otherId,
        initialNickname: nickname,
        avatarColor,
        summary,
        time,
        sortAt,
        unreadCount: unreadByConv.get(conversationId) ?? 0,
      });
    }

    list.sort((a, b) => (b.sortAt || "").localeCompare(a.sortAt || ""));

    setRows(list);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  // 切回本页/标签页时重新拉取列表与昵称，不依赖对方改昵称
  useEffect(() => {
    const onVisible = () => setRefreshTrigger((t) => t + 1);
    if (typeof document !== "undefined" && document.addEventListener) {
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
    }
  }, []);

  // 消息/会话变更时重新拉取列表（含通讯录昵称）
  useEffect(() => {
    if (rows.length === 0) return;
    const conversationIds = rows.map((r) => r.id);
    const channels: ReturnType<typeof supabase.channel>[] = [];
    for (const cid of conversationIds) {
      const ch = supabase
        .channel(`chat-list-msg:${cid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` },
          () => setRefreshTrigger((t) => t + 1)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${cid}` },
          () => setRefreshTrigger((t) => t + 1)
        )
        .subscribe();
      channels.push(ch);
    }
    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }, [rows, supabase]);

  const conversationIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const otherUserIds = useMemo(() => [...new Set(rows.map((r) => r.otherUserId))], [rows]);

  if (loading) {
    return (
      <div className="p-4">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">加载中…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">暂无会话</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ChatListRealtimeRefresher conversationIds={conversationIds} otherUserIds={otherUserIds}>
      <div className="p-4">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((item) => (
                <ChatListRow
                  key={item.id}
                  item={{
                    id: item.id,
                    otherUserId: item.otherUserId,
                    initialNickname: item.initialNickname,
                    avatarColor: item.avatarColor,
                    summary: item.summary,
                    time: item.time,
                    unreadCount: item.unreadCount,
                  }}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ChatListRealtimeRefresher>
  );
}
