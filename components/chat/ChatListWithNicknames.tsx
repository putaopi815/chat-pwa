"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChatListRow, type ChatListRowItem } from "./ChatListRow";

const FALLBACK = "用户";

export interface ChatListWithNicknamesProps {
  rows: ChatListRowItem[];
  otherUserIds: string[];
}

/**
 * 在客户端统一拉取并订阅所有「对方」的昵称，再渲染列表，避免每行独立 fetch 导致的未更新问题。
 */
export function ChatListWithNicknames({ rows, otherUserIds }: ChatListWithNicknamesProps) {
  const [nicknameByUserId, setNicknameByUserId] = useState<Record<string, string>>({});
  const supabase = useMemo(() => createClient(), []);

  // 一次性拉取所有对方的 display_name
  useEffect(() => {
    if (otherUserIds.length === 0) return;
    const ids = [...new Set(otherUserIds)];
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids)
      .then(({ data }) => {
        const next: Record<string, string> = {};
        for (const row of data ?? []) {
          const name = row.display_name?.trim();
          if (row.id) next[row.id] = name || FALLBACK;
        }
        setNicknameByUserId((prev) => ({ ...prev, ...next }));
      });
  }, [otherUserIds, supabase]);

  // 订阅每个对方的 profile 变更
  useEffect(() => {
    if (otherUserIds.length === 0) return;
    const channels: ReturnType<typeof supabase.channel>[] = [];
    for (const uid of otherUserIds) {
      if (!uid) continue;
      const ch = supabase
        .channel(`chat-list-profile:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${uid}`,
          },
          (payload) => {
            const r = payload.new as { id?: string; display_name?: string | null };
            const name = r?.display_name?.trim();
            if (r?.id) {
              setNicknameByUserId((prev) => ({ ...prev, [r.id!]: name || FALLBACK }));
            }
          }
        )
        .subscribe();
      channels.push(ch);
    }
    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }, [otherUserIds, supabase]);

  return (
    <ul className="divide-y divide-border">
      {rows.map((item) => (
        <ChatListRow
          key={item.id}
          item={item}
          nickname={nicknameByUserId[item.otherUserId] ?? item.initialNickname ?? FALLBACK}
        />
      ))}
    </ul>
  );
}
