import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ userId: string }>;
};

/**
 * 根据对方 user id 查找已有单聊或创建新单聊，并跳转到 /chat/[conversationId]
 * 使用 RPC get_or_create_single_conversation，避免客户端受 RLS 限制无法查对方 membership
 */
export default async function ChatUserPage(props: Props) {
  const { userId: otherUserId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (otherUserId === user.id) redirect("/chat");

  const { data: convId, error } = await supabase.rpc("get_or_create_single_conversation", {
    other_user_id: otherUserId,
  });

  if (error || !convId) redirect("/chat");
  redirect(`/chat/${convId}`);
}
