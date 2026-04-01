import { ChatListFromApi } from "@/components/chat/ChatListFromApi";

export const dynamic = "force-dynamic";

/** 鉴权由 proxy + /api/chat/list 负责，避免此处再跑一次 getUser */
export default function ChatPage() {
  return (
    <div className="mx-auto max-w-lg bg-background">
      <header className="h-14 shrink-0 border-b border-border bg-card px-3 flex items-center justify-center shadow-sm">
        <h1 className="text-xl font-semibold text-card-foreground tracking-tight">聊天</h1>
      </header>
      <ChatListFromApi />
    </div>
  );
}
