"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface ContactsRealtimeRefresherProps {
  contactUserIds: string[];
  children: React.ReactNode;
  /** 联系人 profile 变更时刷新列表；不传则用 router.refresh()（服务端页兼容） */
  onProfilesUpdated?: () => void;
}

/**
 * 订阅通讯录中联系人的 profiles 变更，好友更新昵称/头像时刷新列表。
 */
export function ContactsRealtimeRefresher({
  contactUserIds,
  children,
  onProfilesUpdated,
}: ContactsRealtimeRefresherProps) {
  const router = useRouter();
  useEffect(() => {
    if (contactUserIds.length === 0) return;
    const supabase = createClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const onUpdate = () => (onProfilesUpdated ? onProfilesUpdated() : router.refresh());

    for (const uid of contactUserIds) {
      if (!uid) continue;
      const ch = supabase
        .channel(`contacts-profile:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${uid}`,
          },
          onUpdate
        )
        .subscribe();
      channels.push(ch);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [contactUserIds, onProfilesUpdated, router]);

  return <>{children}</>;
}
