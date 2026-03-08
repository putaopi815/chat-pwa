"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/chat/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";

export default function SettingsAccountPage() {
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <PageHeader title="设置" backHref="/me" backLabel="返回" />
      <main className="p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-destructive-muted py-6 text-base font-semibold text-destructive hover:bg-destructive-muted/90"
          onClick={() => setLogoutOpen(true)}
        >
          退出登录
        </Button>
      </main>

      <ConfirmDialog
        open={logoutOpen}
        title="退出登录"
        description="退出后需要重新使用邮箱和密码登录。"
        confirmLabel="退出登录"
        cancelLabel="取消"
        danger
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}
