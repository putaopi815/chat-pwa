import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { SendMessageButton } from "@/components/contacts/SendMessageButton";

const DEFAULT_AVATAR_COLOR = "#C8D4FF";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContactDetailPage(props: Props) {
  const { id: contactUserId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: link } = await supabase
    .from("user_contacts")
    .select("contact_user_id")
    .eq("user_id", user.id)
    .eq("contact_user_id", contactUserId)
    .maybeSingle();

  if (!link) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, account_id, avatar_url")
    .eq("id", contactUserId)
    .single();

  if (!profile) notFound();

  const nickname = profile.display_name?.trim() || "未设置昵称";
  const accountId = profile.account_id ?? "";
  const avatarUrl = profile.avatar_url?.trim() || null;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <PageHeader
        title="联系人详情"
        backHref="/contacts"
        backLabel="返回"
      />
      <main className="flex-1 px-5 pb-8 pt-6">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] bg-surface px-5 py-7">
          <Avatar color={DEFAULT_AVATAR_COLOR} avatarUrl={avatarUrl} size="lg" />
          <h2 className="text-[22px] font-semibold text-foreground">
            {nickname}
          </h2>
          <p className="text-[14px] text-muted-foreground">
            账号 ID: {accountId}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <SendMessageButton
            contactUserId={contactUserId}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius)] bg-primary text-[16px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50"
          >
            发消息
          </SendMessageButton>
        </div>
      </main>
    </div>
  );
}
