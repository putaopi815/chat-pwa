"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Users, UserCircle } from "lucide-react";
import { useUnreadCount } from "@/components/chat/UnreadCountProvider";

const tabs = [
  { href: "/chat", label: "聊天", Icon: MessageCircle, showUnread: true },
  { href: "/contacts", label: "通讯录", Icon: Users, showUnread: false },
  { href: "/me", label: "我的", Icon: UserCircle, showUnread: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalUnread } = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[76px] border-t border-border bg-card shadow-[0_-1px_3px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-card/95 safe-area-pb dark:shadow-[0_-1px_12px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around px-7">
        {tabs.map(({ href, label, Icon, showUnread }, index) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const unread = showUnread ? totalUnread : 0;
          // 在聊天 tab 内时不显示 tab 角标，只保留聊天列表里的未读角标
          const showTabBadge = unread > 0 && !isActive;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => router.prefetch(href)}
              className={`relative flex h-full flex-1 items-center justify-center transition-colors ${
                isFirst ? "mr-2.5" : ""
              } ${isLast ? "ml-2.5" : ""} ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={unread > 0 ? `${label}，${unread} 条未读` : label}
            >
              <Icon
                className="size-6 shrink-0"
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden
              />
              {showTabBadge && (
                <span
                  className="absolute right-1/4 top-2 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold text-destructive-foreground"
                  aria-hidden
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
