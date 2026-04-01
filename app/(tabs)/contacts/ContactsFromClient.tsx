"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyContactsForUser } from "@/lib/supabase/contacts";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContactsContent } from "./ContactsContent";
import type { Contact } from "@/types";

/** 切回通讯录 Tab 时先展示上次列表，再后台刷新（注意：空列表 [] 也是有效缓存，不能用 !cachedContacts 判断） */
let cachedContacts: Contact[] | null = null;

export function ContactsFromClient() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(() => cachedContacts ?? []);
  const [loading, setLoading] = useState(cachedContacts === null);
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
        const list = await getMyContactsForUser(supabase, user.id);
        cachedContacts = list;
        setContacts(list);
        setLoadError(null);
        setLoading(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "加载失败，请稍后重试";
        if (cachedContacts === null) {
          setLoadError(msg);
        } else if (process.env.NODE_ENV === "development") {
          console.warn("[ContactsFromClient] 刷新通讯录失败:", e);
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

  if (loadError && cachedContacts === null) {
    return (
      <div className="mx-auto max-w-lg bg-background">
        <PageHeader title="通讯录" />
        <div className="p-4">
          <Card className="overflow-hidden shadow-sm">
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
        <PageHeader
          title="通讯录"
          rightSlot={
            <Link
              href="/contacts/add"
              className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="添加好友"
            >
              <Plus className="size-6" aria-hidden />
            </Link>
          }
        />
        <div className="p-4">
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">加载中…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ContactsContent initialContacts={contacts} onProfilesUpdated={load} />;
}
