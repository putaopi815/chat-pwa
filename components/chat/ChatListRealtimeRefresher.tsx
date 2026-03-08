"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface ChatListRealtimeRefresherProps {
  conversationIds: string[];
  /** 会话对方用户 ID 列表，用于订阅 profiles 变更以同步昵称/头像 */
  otherUserIds?: string[];
  /** 有更新时调用（如列表来自 API 则传 refetch）；未传则使用 router.refresh() */
  onUpdate?: () => void;
  children: React.ReactNode;
}

/**
 * 订阅当前用户会话的消息、会话表、以及对方 profile 变化，有更新时刷新聊天列表。
 */
export function ChatListRealtimeRefresher({
  conversationIds,
  otherUserIds = [],
  onUpdate,
  children,
}: ChatListRealtimeRefresherProps) {
  const router = useRouter();
  useEffect(() => {
    if (conversationIds.length === 0) return;
    const supabase = createClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const handleUpdate = () => (onUpdate ? onUpdate() : router.refresh());

    for (const cid of conversationIds) {
      const ch = supabase
        .channel(`list-messages:${cid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${cid}`,
          },
          handleUpdate
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${cid}`,
          },
          handleUpdate
        )
        .subscribe();
      channels.push(ch);
    }

    for (const uid of otherUserIds) {
      if (!uid) continue;
      const ch = supabase
        .channel(`list-profile:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${uid}`,
          },
          handleUpdate
        )
        .subscribe();
      channels.push(ch);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [conversationIds, otherUserIds, onUpdate, router]);

  return <>{children}</>;
}
