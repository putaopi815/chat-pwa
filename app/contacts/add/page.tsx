"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { searchProfilesByAccountId, addContact } from "@/lib/supabase/contacts";

type SearchResult = {
  id: string;
  display_name: string | null;
  account_id: string;
  avatar_url?: string | null;
};

export default function AddContactPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = accountId.trim();
    if (!trimmed) {
      setError("请输入账号 ID");
      setResult(null);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const profile = await searchProfilesByAccountId(supabase, trimmed);
      if (profile) {
        setResult({
          id: profile.id,
          display_name: profile.display_name,
          account_id: profile.account_id,
          avatar_url: profile.avatar_url ?? null,
        });
      } else {
        setError("未找到该账号，请检查账号 ID 是否正确");
      }
    } catch {
      setError("搜索失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!result) return;
    setAddLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { ok, error: err } = await addContact(supabase, result.id);
      if (ok) {
        router.push("/contacts");
        return;
      }
      setError(err ?? "添加失败");
    } catch {
      setError("添加失败，请稍后重试");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <PageHeader title="添加好友" backHref="/contacts" backLabel="返回" />
      <main className="flex-1 px-4 py-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setResult(null);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="输入对方账号 ID（如 user_xxxxxxxx）"
            className="h-12 flex-1 text-[15px]"
          />
          <Button
            type="button"
            className="h-12 px-5"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "搜索中…" : "搜索"}
          </Button>
        </div>
        {error && (
          <p className="mt-3 text-[14px] text-destructive">{error}</p>
        )}
        {result && (
          <div className="mt-6 flex items-center gap-4 rounded-[12px] border border-border bg-surface p-4">
            <Avatar color="#C8D4FF" avatarUrl={result.avatar_url} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-medium text-foreground truncate">
                {result.display_name?.trim() || "未设置昵称"}
              </p>
              <p className="text-[14px] text-muted-foreground">
                账号 ID: {result.account_id}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={addLoading}
            >
              {addLoading ? "添加中…" : "添加"}
            </Button>
          </div>
        )}
        <p className="mt-6 text-[13px] text-muted-foreground">
          账号 ID 可在对方「我」页或「个人信息」中查看，格式一般为 user_ 开头的字符串。
        </p>
      </main>
    </div>
  );
}
