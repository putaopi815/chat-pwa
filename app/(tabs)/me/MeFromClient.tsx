"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggleRow } from "@/components/me/ThemeToggleRow";

const DEFAULT_AVATAR_COLOR = "#C8D4FF";

type MeCache = {
  displayName: string;
  accountId: string;
  avatarUrl: string | null;
};

let cachedMe: MeCache | null = null;

export function MeFromClient() {
  const router = useRouter();
  const [me, setMe] = useState<MeCache>(
    () =>
      cachedMe ?? {
        displayName: "未设置昵称",
        accountId: "",
        avatarUrl: null,
      }
  );
  const [loading, setLoading] = useState(!cachedMe);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fetchInFlightRef = useRef(false);

  const load = useMemo(
    () => async () => {
      if (fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, account_id, avatar_url")
          .eq("id", user.id)
          .single();

        const next: MeCache = {
          displayName: profile?.display_name?.trim() || "未设置昵称",
          accountId: profile?.account_id ?? "",
          avatarUrl: profile?.avatar_url ?? null,
        };
        cachedMe = next;
        setMe(next);
        setLoadError(null);
        setLoading(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "加载失败，请稍后重试";
        if (!cachedMe) {
          setLoadError(msg);
        } else if (process.env.NODE_ENV === "development") {
          console.warn("[MeFromClient] 刷新资料失败:", e);
        }
        setLoading(false);
      } finally {
        fetchInFlightRef.current = false;
      }
    },
    [router]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  if (loadError && !cachedMe) {
    return (
      <div className="mx-auto max-w-lg bg-background">
        <PageHeader title="我的" />
        <div className="p-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-destructive">{loadError}</p>
              <p className="text-xs text-muted-foreground">
                若使用在线预览，请确认已配置环境变量 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setLoading(true);
                  void load();
                }}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                重试
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg bg-background">
        <PageHeader title="我的" />
        <div className="p-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">加载中…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg bg-background">
      <PageHeader title="我的" />
      <div className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar color={DEFAULT_AVATAR_COLOR} avatarUrl={me.avatarUrl} size="xl" />
            <div className="min-w-0">
              <p className="text-xl font-semibold text-card-foreground">{me.displayName}</p>
              <p className="text-sm text-muted-foreground">ID: {me.accountId || "—"}</p>
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
