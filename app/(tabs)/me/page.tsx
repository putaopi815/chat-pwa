import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggleRow } from "@/components/me/ThemeToggleRow";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_AVATAR_COLOR = "#C8D4FF";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_id, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name?.trim() || "未设置昵称";
  const accountId = profile?.account_id ?? "";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="mx-auto max-w-lg bg-background">
      <PageHeader title="我的" />
      <div className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar color={DEFAULT_AVATAR_COLOR} avatarUrl={avatarUrl} size="xl" />
            <div className="min-w-0">
              <p className="text-xl font-semibold text-card-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">ID: {accountId || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ThemeToggleRow />
            <Link
              href="/settings"
              className="flex items-center justify-between border-t border-border px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent/50 active:bg-accent"
            >
              个人信息
              <span className="text-muted-foreground">›</span>
            </Link>
            <Link
              href="/settings/account"
              className="flex items-center justify-between border-t border-border px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent/50 active:bg-accent rounded-b-[var(--radius-lg)]"
            >
              设置
              <span className="text-muted-foreground">›</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
