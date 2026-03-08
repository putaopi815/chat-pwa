import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatListFromApi } from "@/components/chat/ChatListFromApi";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-lg bg-background">
      <header className="h-14 shrink-0 border-b border-border bg-card px-3 flex items-center justify-center shadow-sm">
        <h1 className="text-xl font-semibold text-card-foreground tracking-tight">聊天</h1>
      </header>
      <ChatListFromApi />
    </div>
  );
}
