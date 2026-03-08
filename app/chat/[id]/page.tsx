import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatDetailClient } from "@/components/chat/ChatDetailClient";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
};

export default async function ChatDetailPage(props: Props) {
  const { id: conversationId } = await props.params;
  const { name: nameFromList } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, is_cleared_for_all")
    .eq("id", conversationId)
    .single();
  if (!conv) redirect("/chat");

  const { data: otherUserIdRaw } = await supabase.rpc("get_other_conversation_member", {
    conv_id: conversationId,
  });
  const otherUserId = typeof otherUserIdRaw === "string" ? otherUserIdRaw : null;
  if (!otherUserId) redirect("/chat");

  const [resOther, resMy, resLastRead] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", otherUserId).single(),
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
    supabase.rpc("get_other_member_last_read_at", { conv_id: conversationId }),
  ]);
  const otherProfile = resOther.data;
  const myProfile = resMy.data;
  const otherLastReadAtRaw = resLastRead.data;
  const otherUserDisplayName = otherProfile?.display_name?.trim() || "用户";
  const otherUserAvatarUrl = otherProfile?.avatar_url?.trim() || null;
  const currentUserAvatarUrl = myProfile?.avatar_url?.trim() ?? null;
  const initialOtherLastReadAt =
    otherLastReadAtRaw != null ? String(otherLastReadAtRaw) : null;

  supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .then(() => {});

  return (
    <ChatDetailClient
      conversationId={conversationId}
      currentUserId={user.id}
      otherUserId={otherUserId}
      otherUserDisplayName={otherUserDisplayName}
      otherUserAvatarUrl={otherUserAvatarUrl}
      currentUserAvatarUrl={currentUserAvatarUrl}
      nameFromList={nameFromList ?? null}
      initialIsClearedForAll={conv.is_cleared_for_all ?? false}
      initialOtherLastReadAt={initialOtherLastReadAt}
    />
  );
}
