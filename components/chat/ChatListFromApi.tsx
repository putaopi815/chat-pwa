"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ChatListRow } from "./ChatListRow";
import { ChatListRealtimeRefresher } from "./ChatListRealtimeRefresher";
import { useUnreadCount } from "@/components/chat/UnreadCountProvider";
import type { ChatListRow as ChatListRowType } from "@/app/api/chat/list/route";

const CHAT_LIST_POLL_INTERVAL_MS = 3000;

/** 模块级缓存：切回聊天 tab 时先展示上次列表，再后台刷新，避免长时间「加载中」 */
let cachedList: {
  rows: ChatListRowType[];
  conversationIds: string[];
  otherUserIds: string[];
} | null = null;

export function ChatListFromApi() {
  const router = useRouter();
  const { refetch: refetchUnread } = useUnreadCount();
  const [rows, setRows] = useState<ChatListRowType[]>(() => cachedList?.rows ?? []);
  const [conversationIds, setConversationIds] = useState<string[]>(() => cachedList?.conversationIds ?? []);
  const [otherUserIds, setOtherUserIds] = useState<string[]>(() => cachedList?.otherUserIds ?? []);
  const [loading, setLoading] = useState(!cachedList);

  const fetchList = useMemo(
    () => async () => {
      const res = await fetch("/api/chat/list", {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        setRows([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const nextRows = data.rows ?? [];
      const nextConvIds = data.conversationIds ?? [];
      const nextOtherIds = data.otherUserIds ?? [];
      cachedList = { rows: nextRows, conversationIds: nextConvIds, otherUserIds: nextOtherIds };
      setRows(nextRows);
      setConversationIds(nextConvIds);
      setOtherUserIds(nextOtherIds);
      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const onVisible = () => fetchList();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchList]);

  // 任意页面收到新消息时（由 UnreadCountProvider 派发），即时刷新列表并更新底部未读角标
  useEffect(() => {
    const onNewMessage = () => {
      fetchList();
      refetchUnread();
    };
    window.addEventListener("chat:new-message", onNewMessage);
    return () => window.removeEventListener("chat:new-message", onNewMessage);
  }, [fetchList, refetchUnread]);

  // 停留在聊天列表时轮询：列表与底部「聊天」未读角标实时更新（Realtime 未生效时的兜底）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchList();
      refetchUnread();
    }, CHAT_LIST_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchList, refetchUnread]);

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
    <ChatListRealtimeRefresher
      conversationIds={conversationIds}
      otherUserIds={otherUserIds}
      onUpdate={fetchList}
    >
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
                    avatarUrl: item.avatarUrl,
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
