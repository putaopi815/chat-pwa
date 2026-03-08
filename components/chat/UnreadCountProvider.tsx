"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type UnreadCountContextValue = {
  totalUnread: number;
  refetch: () => Promise<void>;
};

const UnreadCountContext = createContext<UnreadCountContextValue>({
  totalUnread: 0,
  refetch: async () => {},
});

export function useUnreadCount(): UnreadCountContextValue {
  const ctx = useContext(UnreadCountContext);
  return ctx;
}

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);
  const pathname = usePathname();
  const channelsRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]>[]>([]);
  const authPromiseRef = useRef<Promise<{ user: User | null }> | null>(null);

  const getCurrentUser = useCallback(async (): Promise<{ user: User | null }> => {
    if (authPromiseRef.current) return authPromiseRef.current;
    const supabase = createClient();
    const promise = supabase.auth.getUser().then(({ data: { user } }) => ({ user }));
    authPromiseRef.current = promise;
    promise.finally(() => {
      authPromiseRef.current = null;
    });
    return promise;
  }, []);

  const fetchTotalUnread = useCallback(async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      setTotalUnread(0);
      return;
    }
    const supabase = createClient();
    const { data: unreadRows } = await supabase.rpc("get_conversation_unread_counts");
    const rows = (unreadRows ?? []) as { conversation_id: string; unread_count: number }[];
    const total = rows.reduce((sum, r) => sum + Number(r.unread_count ?? 0), 0);
    setTotalUnread(total);
  }, [getCurrentUser]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    channelsRef.current = [];

    const setup = async () => {
      const { user } = await getCurrentUser();
      if (!user || !mounted) {
        if (mounted) setTotalUnread(0);
        return;
      }

      await fetchTotalUnread();
      if (!mounted) return;

      // 订阅当前用户的 conversation_members 更新（进入会话时 last_read_at 会更新）
      const membersChannel = supabase
        .channel("unread-members")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversation_members",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchTotalUnread();
          }
        )
        .subscribe();
      channelsRef.current.push(membersChannel);

      // 先拉取当前用户的会话 ID，再订阅这些会话的新消息
      const { data: members } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);
      const conversationIds = [...new Set((members ?? []).map((m) => m.conversation_id))];

      for (const cid of conversationIds) {
        if (!mounted) break;
        const ch = supabase
          .channel(`unread-msg:${cid}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${cid}`,
            },
            (payload) => {
              fetchTotalUnread();
              // 派发全局事件，聊天列表/对话页可监听并即时刷新（任意页面都能收到新消息）
              const convId = (payload.new as Record<string, unknown>)?.conversation_id as string | undefined;
              if (convId) {
                window.dispatchEvent(
                  new CustomEvent("chat:new-message", { detail: { conversationId: convId, message: payload.new } })
                );
              }
            }
          )
          .subscribe();
        channelsRef.current.push(ch);
      }
    };

    setup();

    return () => {
      mounted = false;
      const client = createClient();
      channelsRef.current.forEach((ch) => client.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [fetchTotalUnread]);

  // 切换到聊天相关页面时重新拉取未读数（进入会话后 last_read_at 已更新，立即反映角标）
  useEffect(() => {
    if (pathname === "/chat" || pathname.startsWith("/chat/")) {
      fetchTotalUnread();
    }
  }, [pathname, fetchTotalUnread]);

  return (
    <UnreadCountContext.Provider
      value={{
        totalUnread,
        refetch: fetchTotalUnread,
      }}
    >
      {children}
    </UnreadCountContext.Provider>
  );
}
