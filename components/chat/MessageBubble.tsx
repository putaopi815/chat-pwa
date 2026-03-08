"use client";

import { CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { MessageStatus } from "@/types";

export interface MessageBubbleProps {
  id: string;
  content: string;
  isSelf: boolean;
  status: MessageStatus;
  /** 该条消息发送者的头像 URL（与「我的」页选择的头像同步） */
  avatarUrl?: string | null;
  /** 己方消息且对方已读时显示小对勾 */
  showReadIndicator?: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({
  id,
  content,
  isSelf,
  status,
  avatarUrl,
  showReadIndicator,
  onLongPress,
}: MessageBubbleProps) {
  if (status === "purged_for_all") {
    return null;
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === "normal") onLongPress?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (status !== "normal") return;
    (e.currentTarget as HTMLElement).dataset.longPressTimeout = String(
      window.setTimeout(() => {
        onLongPress?.();
      }, 500)
    );
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    const timeoutId = el.dataset.longPressTimeout;
    if (timeoutId) {
      clearTimeout(Number(timeoutId));
      delete el.dataset.longPressTimeout;
    }
  };

  const handleTouchCancel = handleTouchEnd;

  if (status === "recalled") {
    return (
      <div className="flex w-full justify-center px-4 py-1">
        <span className="text-[13px] text-muted-foreground">
          {isSelf ? "你撤回了一条消息" : "对方撤回了一条消息"}
        </span>
      </div>
    );
  }

  const bubble = (
    <div
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`flex max-w-[238px] items-end gap-1.5 rounded-[14px] px-3 py-2.5 text-[15px] font-normal ${
        isSelf
          ? "flex-row-reverse bg-[#DCE8FF] text-foreground dark:bg-[#E5E5E5] dark:text-black"
          : "bg-surface text-foreground dark:bg-[#171717] dark:text-foreground"
      }`}
    >
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{content}</span>
    </div>
  );

  return (
    <div
      className={`flex w-full items-start gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"} px-4 py-1.5`}
    >
      <Avatar
        color={isSelf ? "#DCE8FF" : "#C8D4FF"}
        avatarUrl={avatarUrl}
        size="sm"
        rounded="md"
        className="shrink-0"
      />
      {/* 己方消息：已读图标在气泡左侧，与气泡间距 4px */}
      {isSelf ? (
        <div className="flex flex-row-reverse items-end gap-[4px]">
          {bubble}
          {showReadIndicator && (
            <CheckCheck
              className="size-3.5 shrink-0 text-muted-foreground"
              strokeWidth={2.25}
              aria-label="已读"
            />
          )}
        </div>
      ) : (
        bubble
      )}
    </div>
  );
}
