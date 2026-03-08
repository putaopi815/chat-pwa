"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Message, MessageStatus } from "@/types";
import { shouldShowMessageTime, formatChatMessageTime } from "@/lib/format-time";
import { MessageBubble } from "./MessageBubble";
import { ChatInputBar } from "./ChatInputBar";
import { MessageActionSheet } from "./MessageActionSheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { useProfileDisplayName } from "@/lib/hooks/useProfileDisplayName";

/** 聊天详情按会话缓存：切回某会话时先展示上次数据，再后台刷新 */
const detailCache = new Map<
  string,
  { messages: Message[]; isClearedForAll: boolean; otherLastReadAt: string | null }
>();

export interface ChatDetailClientProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserDisplayName: string;
  /** 对方用户头像 URL（与「我的」页选择的默认头像同步） */
  otherUserAvatarUrl?: string | null;
  /** 当前用户头像 URL（聊天页消息气泡中己方头像同步） */
  currentUserAvatarUrl?: string | null;
  /** 从聊天列表传入的对方名称，保证与列表展示一致 */
  nameFromList?: string | null;
  initialIsClearedForAll: boolean;
  /** 对方在此会话的 last_read_at，用于展示己方消息的已读勾 */
  initialOtherLastReadAt: string | null;
}

export function ChatDetailClient({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserDisplayName,
  otherUserAvatarUrl,
  currentUserAvatarUrl,
  nameFromList,
  initialIsClearedForAll,
  initialOtherLastReadAt,
}: ChatDetailClientProps) {
  const cached = typeof window !== "undefined" ? detailCache.get(conversationId) : undefined;
  const [messages, setMessages] = useState<Message[]>(() => cached?.messages ?? []);
  const [isClearedForAll, setIsClearedForAll] = useState(() => cached?.isClearedForAll ?? initialIsClearedForAll);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(() => cached?.otherLastReadAt ?? initialOtherLastReadAt);
  const [loading, setLoading] = useState(!cached);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const router = useRouter();
  const displayName = useProfileDisplayName(
    otherUserId,
    otherUserDisplayName?.trim() || nameFromList?.trim() || null
  );
  const allPurged = isClearedForAll;
  const visibleMessages = messages.filter(
    (m) => m.status !== "purged_for_all" && !deletedMessageIds.has(m.id)
  );

  const supabase = useMemo(() => createClient(), []);

  const handleBackToChatList = useCallback(() => {
    router.push("/chat");
    router.refresh();
  }, [router]);

  const loadMessages = useCallback(async (): Promise<Message[]> => {
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, status, recalled_at, recalled_by, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    const next = (data ?? []).map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      status: (m.status as MessageStatus) ?? "normal",
    }));
    setMessages(next);
    return next;
  }, [conversationId]);

  const loadConversationCleared = useCallback(async (): Promise<boolean> => {
    const { data } = await supabase
      .from("conversations")
      .select("is_cleared_for_all")
      .eq("id", conversationId)
      .single();
    const value = data?.is_cleared_for_all ?? false;
    setIsClearedForAll(value);
    return value;
  }, [conversationId, supabase]);

  /** 拉取对方在此会话的 last_read_at（经 RPC，RLS 下无法直接读对方行），用于己方消息的已读图标 */
  const loadOtherLastReadAt = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.rpc("get_other_member_last_read_at", {
      conv_id: conversationId,
    });
    const value = data != null ? String(data) : null;
    setOtherLastReadAt(value);
    return value;
  }, [conversationId, supabase]);

  /** 更新自己在当前会话的 last_read_at，便于对方看到己方“已读” */
  const updateMyLastReadAt = useCallback(async () => {
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId);
  }, [conversationId, currentUserId, supabase]);

  useEffect(() => {
    const hadCache = detailCache.has(conversationId);
    if (!hadCache) setLoading(true);
    Promise.all([
      loadMessages(),
      loadConversationCleared(),
      loadOtherLastReadAt(),
    ])
      .then(([messages, isCleared, lastRead]) => {
        detailCache.set(conversationId, {
          messages,
          isClearedForAll: isCleared,
          otherLastReadAt: lastRead,
        });
      })
      .finally(() => setLoading(false));
  }, [loadMessages, loadConversationCleared, loadOtherLastReadAt, conversationId]);

  const POLL_INTERVAL_MS = 5000;
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadConversationCleared();
      loadOtherLastReadAt();
      updateMyLastReadAt();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages, loadConversationCleared, loadOtherLastReadAt, updateMyLastReadAt]);

  // 从其他标签页回到当前页时刷新消息与已读状态
  useEffect(() => {
    const onVisible = () => {
      loadMessages();
      loadConversationCleared();
      loadOtherLastReadAt();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadMessages, loadConversationCleared, loadOtherLastReadAt]);

  // 任意页面收到本会话新消息时（由 UnreadCountProvider 派发），即时追加到列表
  useEffect(() => {
    const onNewMessage = (e: Event) => {
      const { conversationId: cid, message: raw } = (e as CustomEvent).detail ?? {};
      if (cid !== conversationId || !raw) return;
      const r = raw as Record<string, unknown>;
      const id = r.id as string;
      setMessages((prev) => {
        if (prev.some((m) => m.id === id)) return prev;
        return [
          ...prev,
          {
            id,
            conversation_id: r.conversation_id as string,
            sender_id: r.sender_id as string,
            content: (r.content as string) ?? "",
            created_at: (r.created_at as string) ?? new Date().toISOString(),
            status: (r.status as MessageStatus) ?? "normal",
          },
        ];
      });
    };
    window.addEventListener("chat:new-message", onNewMessage);
    return () => window.removeEventListener("chat:new-message", onNewMessage);
  }, [conversationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const r = payload.new as Record<string, unknown>;
            const id = r.id as string;
            setMessages((prev) => {
              if (prev.some((m) => m.id === id)) return prev;
              return [
                ...prev,
                {
                  id,
                  conversation_id: r.conversation_id as string,
                  sender_id: r.sender_id as string,
                  content: (r.content as string) ?? "",
                  created_at: (r.created_at as string) ?? new Date().toISOString(),
                  status: (r.status as MessageStatus) ?? "normal",
                },
              ];
            });
          }
          if (payload.eventType === "UPDATE") {
            const r = payload.new as Record<string, unknown>;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === r.id
                  ? {
                      ...m,
                      content: (r.content as string) ?? m.content,
                      status: (r.status as MessageStatus) ?? m.status,
                    }
                  : m
              )
            );
          }
        }
      )
      .subscribe();

    const convChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          setIsClearedForAll((r.is_cleared_for_all as boolean) ?? false);
        }
      )
      .subscribe();

    // 订阅对方在此会话的 last_read_at，用于己方消息的已读勾
    const otherReadChannel = supabase
      .channel(`conv-member-other:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if (r.user_id === otherUserId && r.last_read_at != null) {
            setOtherLastReadAt(String(r.last_read_at));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(convChannel);
      supabase.removeChannel(otherReadChannel);
    };
  }, [conversationId, otherUserId, supabase]);

  const scrollToBottom = useCallback(() => {
    mainScrollRef.current?.scrollTo({ top: mainScrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (visibleMessages.length > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = visibleMessages.length;
      scrollToBottom();
    } else {
      prevMessagesLengthRef.current = visibleMessages.length;
    }
  }, [visibleMessages.length, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string): Promise<boolean> => {
      let content = text.trim();
      if (replyingTo) {
        const quote = replyingTo.content.length > 80 ? replyingTo.content.slice(0, 80) + "…" : replyingTo.content;
        content = `回复：「${quote}」\n\n${content}`;
        setReplyingTo(null);
      }
      if (process.env.NODE_ENV === "development") {
        console.log("[ChatDetailClient] handleSend 调用", { text: content.slice(0, 50), conversationId });
      }
      setSendError(null);
      setSending(true);
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content,
            status: "normal",
          })
          .select("id, created_at")
          .single();
        if (process.env.NODE_ENV === "development") {
          if (insertErr) {
            console.error("[ChatDetailClient] insert 失败", insertErr.code, insertErr.message, insertErr);
          } else {
            console.log("[ChatDetailClient] insert 成功", { id: inserted?.id });
          }
        }
        if (insertErr) {
          setSendError(insertErr.message || "发送失败，请重试");
          return false;
        }
        const createdAt = inserted?.created_at ?? new Date().toISOString();
        const newId = inserted?.id ?? crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: newId,
            conversation_id: conversationId,
            sender_id: currentUserId,
            content,
            created_at: createdAt,
            status: "normal" as const,
          },
        ]);
        requestAnimationFrame(() => scrollToBottom());
        const { error: updateErr } = await supabase
          .from("conversations")
          .update({
            last_message_preview: content.slice(0, 100),
            last_message_at: createdAt,
          })
          .eq("id", conversationId);
        if (process.env.NODE_ENV === "development") {
          if (updateErr) console.warn("[ChatDetailClient] 更新会话预览失败", updateErr.message);
          else console.log("[ChatDetailClient] 发送完成");
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "发送失败，请重试";
        if (process.env.NODE_ENV === "development") {
          console.error("[ChatDetailClient] 发送异常:", err);
        }
        setSendError(msg);
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId, replyingTo, scrollToBottom, supabase]
  );

  const openActionSheet = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
    setActionSheetOpen(true);
  }, []);

  const handleQuote = useCallback(() => {
    if (!selectedMessageId) return;
    const msg = messages.find((m) => m.id === selectedMessageId);
    if (msg) setReplyingTo({ id: msg.id, content: msg.content });
  }, [selectedMessageId, messages]);

  const handleDelete = useCallback(() => {
    if (selectedMessageId) setDeletedMessageIds((prev) => new Set(prev).add(selectedMessageId));
  }, [selectedMessageId]);

  const handleRecall = useCallback(async () => {
    if (!selectedMessageId) return;
    const msg = messages.find((m) => m.id === selectedMessageId);
    if (!msg || msg.sender_id !== currentUserId) return;

    const { error: updateErr } = await supabase
      .from("messages")
      .update({
        status: "recalled",
        recalled_at: new Date().toISOString(),
        recalled_by: currentUserId,
      })
      .eq("id", selectedMessageId);

    if (updateErr) return;

    const { data: sorted } = await supabase
      .from("messages")
      .select("id, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sorted?.id === selectedMessageId) {
      const preview = "你撤回了一条消息";
      const { data: recalledMsg } = await supabase
        .from("messages")
        .select("created_at")
        .eq("id", selectedMessageId)
        .single();
      await supabase
        .from("conversations")
        .update({
          last_message_preview: preview,
          last_message_at: recalledMsg?.created_at ?? new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    setActionSheetOpen(false);
    setSelectedMessageId(null);
  }, [selectedMessageId, messages, conversationId, currentUserId, supabase]);

  /** 清空双方聊天记录：更新会话与全部消息状态，对方实时订阅会收到更新，实现双向清空 */
  const handleConfirmClear = useCallback(async () => {
    const { error: convErr } = await supabase
      .from("conversations")
      .update({
        is_cleared_for_all: true,
        cleared_for_all_at: new Date().toISOString(),
        cleared_by: currentUserId,
      })
      .eq("id", conversationId);

    if (convErr) return;

    await supabase
      .from("messages")
      .update({ status: "purged_for_all" })
      .eq("conversation_id", conversationId);

    setIsClearedForAll(true);
    setMessages((prev) => prev.map((m) => ({ ...m, status: "purged_for_all" as MessageStatus })));
    setConfirmClearOpen(false);
  }, [conversationId, currentUserId, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="h-14 shrink-0 border-b border-border bg-card px-3 flex items-center gap-2">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="h-5 flex-1 max-w-[120px] rounded bg-muted animate-pulse" />
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--chat-area-bg)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <div className="h-[84px] shrink-0 border-t border-border bg-surface" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 左右按钮统一：size-10 (40px)，与 header 左右边距一致，当前边距为 12px (px-3) */}
      <header className="z-20 grid h-14 shrink-0 grid-cols-[1fr_2fr_1fr] items-center gap-2 border-b border-border bg-card px-3 shadow-sm">
        <button
          type="button"
          onClick={handleBackToChatList}
          className="flex size-10 shrink-0 items-center justify-center justify-self-start text-primary hover:opacity-80"
          aria-label="返回"
        >
          <span className="text-[2em] leading-none" style={{ fontFamily: "system-ui" }} aria-hidden>
            ‹
          </span>
        </button>
        <h1 className="min-w-0 truncate text-center text-[17px] font-semibold text-card-foreground">
          {displayName}
        </h1>
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="flex size-10 shrink-0 items-center justify-center justify-self-end rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="清空双方聊天记录"
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
        </button>
      </header>

      <main
        ref={mainScrollRef}
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-[var(--chat-area-bg)] pt-4 pb-2"
      >
        {allPurged && visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-[15px] font-normal text-muted-foreground">聊天记录已清空</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {visibleMessages.map((msg, index) => {
              const prev = index > 0 ? visibleMessages[index - 1] : null;
              const showTime = shouldShowMessageTime(msg.created_at, prev?.created_at ?? null);
              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="py-2 text-center text-[12px] text-muted-foreground">
                      {formatChatMessageTime(msg.created_at)}
                    </p>
                  )}
                  <MessageBubble
                    id={msg.id}
                    content={msg.content}
                    isSelf={msg.sender_id === currentUserId}
                    status={msg.status ?? "normal"}
                    avatarUrl={
                      msg.sender_id === currentUserId ? currentUserAvatarUrl : otherUserAvatarUrl
                    }
                    showReadIndicator={
                      msg.sender_id === currentUserId &&
                      msg.status === "normal" &&
                      otherLastReadAt != null &&
                      new Date(msg.created_at).getTime() <= new Date(otherLastReadAt).getTime()
                    }
                    onLongPress={
                      msg.status === "normal" ? () => openActionSheet(msg.id) : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 底部固定：错误提示 + 输入栏 */}
      <div className="shrink-0 bg-surface">
        {sendError && (
          <p className="px-3 py-1.5 text-center text-sm text-destructive" role="alert">
            {sendError}
          </p>
        )}
        <ChatInputBar
          onSend={handleSend}
          placeholder="输入消息"
          sendLabel="发送"
          disabled={sending}
          replyPreview={replyingTo ? { content: replyingTo.content } : null}
          onCancelReply={replyingTo ? () => setReplyingTo(null) : undefined}
        />
      </div>

      <MessageActionSheet
        open={actionSheetOpen}
        onClose={() => {
          setActionSheetOpen(false);
          setSelectedMessageId(null);
        }}
        isSelf={(() => {
          const msg = messages.find((m) => m.id === selectedMessageId);
          return msg ? msg.sender_id === currentUserId : false;
        })()}
        messageCreatedAt={messages.find((m) => m.id === selectedMessageId)?.created_at}
        onRecall={handleRecall}
        onQuote={handleQuote}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="清空聊天记录"
        description="清空后将删除你与对方设备上的所有聊天记录，且无法恢复。"
        confirmLabel="清空"
        cancelLabel="取消"
        danger
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
