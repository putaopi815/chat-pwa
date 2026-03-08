"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export interface ChatListRowItem {
  id: string;
  otherUserId: string;
  initialNickname: string;
  avatarColor: string;
  avatarUrl?: string | null;
  summary: string;
  time: string;
  unreadCount: number;
}

export function ChatListRow({ item }: { item: ChatListRowItem }) {
  return (
    <li>
      <Link
        href={`/chat/${item.id}`}
        className="flex min-h-[76px] items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/50 active:bg-accent"
      >
        <div className="relative shrink-0">
          <Avatar color={item.avatarColor} avatarUrl={item.avatarUrl} size="list" rounded="lg" />
          {item.unreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold text-destructive-foreground"
              aria-label={`未读 ${item.unreadCount} 条`}
            >
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-base font-semibold text-foreground">
              {item.initialNickname || "用户"}
            </p>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {item.time}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {item.summary || " "}
          </p>
        </div>
      </Link>
    </li>
  );
}
