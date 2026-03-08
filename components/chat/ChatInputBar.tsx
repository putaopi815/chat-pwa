"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export interface ChatInputBarProps {
  placeholder?: string;
  sendLabel?: string;
  /** 返回 Promise 时会在完成后再清空输入；resolve 表示成功，reject 或 resolve(false) 表示失败不清空 */
  onSend: (text: string) => void | Promise<void | boolean>;
  disabled?: boolean;
  /** 引用回复时展示的被引用内容，有则显示引用条 */
  replyPreview?: { content: string } | null;
  onCancelReply?: () => void;
}

export function ChatInputBar({
  placeholder = "输入消息",
  sendLabel = "发送",
  onSend,
  disabled = false,
  replyPreview = null,
  onCancelReply,
}: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled && !sending;

  const handleSubmit = async () => {
    const text = value.trim();
    if (process.env.NODE_ENV === "development") {
      console.log("[ChatInputBar] handleSubmit", { text: text || "(空)", disabled, sending });
    }
    if (!text || disabled || sending) return;
    setSending(true);
    try {
      const result = onSend(text);
      const ok =
        result != null && typeof (result as Promise<unknown>).then === "function"
          ? await (result as Promise<void | boolean>)
          : true;
      if (ok !== false) setValue("");
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[ChatInputBar] onSend 异常", e);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ChatInputBar] 点击发送", { canSend, valueLength: value.trim().length, disabled });
    }
    void handleSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex shrink-0 flex-col justify-center border-t border-border bg-surface px-3"
      style={{
        paddingTop: "env(safe-area-inset-bottom, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(84px + 2 * env(safe-area-inset-bottom, 0px))",
      }}
    >
      {replyPreview && (
        <div className="flex items-center gap-2 border-b border-border py-2">
          <span className="text-[13px] text-muted-foreground shrink-0">引用：</span>
          <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
            {replyPreview.content.length > 60 ? replyPreview.content.slice(0, 60) + "…" : replyPreview.content}
          </p>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="shrink-0 text-[13px] text-primary active:opacity-80"
            >
              取消
            </button>
          )}
        </div>
      )}
      <div className="flex h-[84px] items-center">
        <div className="flex h-10 w-full max-w-full items-center gap-2.5">
          <div className="flex h-10 min-w-0 flex-1 items-center rounded-[12px] border border-input bg-surface px-3">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="max-h-24 w-full resize-none bg-transparent py-2 text-[14px] leading-[1.25rem] text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
            />
          </div>
          {/* 按钮 disabled 时点击会穿透到此处，控制台可看到反馈 */}
          <div
            className="flex shrink-0 items-center"
            onClick={() => {
              if (!canSend && process.env.NODE_ENV === "development") {
                console.log("[ChatInputBar] 点击发送区域", {
                  canSend,
                  valueLength: value.trim().length,
                  hint: value.trim() ? "可发送" : "请输入内容后再发送",
                });
              }
            }}
          >
            <Button
              type="button"
              size="lg"
              className="h-10 min-h-10 w-[68px] shrink-0"
              onClick={handleSendClick}
              disabled={!canSend}
            >
              {sending ? "发送中…" : sendLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
