"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <PageHeader title="个人信息" backHref="/me" backLabel="返回" />
      <main className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Link
              href="/settings/avatar"
              className="flex items-center justify-between border-b border-border px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent/50 active:bg-accent first:rounded-t-[var(--radius-lg)]"
            >
              选择头像
              <span className="text-muted-foreground">›</span>
            </Link>
            <Link
              href="/settings/nickname"
              className="flex items-center justify-between px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-accent/50 active:bg-accent rounded-b-[var(--radius-lg)]"
            >
              修改昵称
              <span className="text-muted-foreground">›</span>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}