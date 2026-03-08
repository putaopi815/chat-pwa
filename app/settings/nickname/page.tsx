"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

export default function NicknamePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; type: "success" | "error"; message: string }>({
    open: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    const load = async () => {
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
        .select("display_name")
        .eq("id", user.id)
        .single();
      setValue(profile?.display_name?.trim() ?? "");
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async () => {
    const trimmed = value.trim();
    setToast((prev) => ({ ...prev, open: false }));
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setToast({ open: true, type: "error", message: "请先登录" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed || null })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setToast({ open: true, type: "error", message: error.message || "保存失败" });
      return;
    }
    setToast({ open: true, type: "success", message: "保存成功" });
  };

  const handleToastClose = () => {
    setToast((prev) => ({ ...prev, open: false }));
    router.back();
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-background">
        <PageHeader title="修改昵称" backHref="/settings" backLabel="返回" />
        <main className="px-5 py-5">
          <p className="text-[14px] text-muted-foreground">加载中…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <PageHeader title="修改昵称" backHref="/settings" backLabel="返回" />
      <main className="px-5 py-5">
        <div className="space-y-3">
          <label className="text-[14px] font-medium text-muted-foreground">
            昵称
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="请输入昵称"
            disabled={saving}
            className="h-12 w-full rounded-[var(--radius)] border border-border-input bg-surface px-3.5 text-[15px] text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-[var(--radius)] bg-primary text-[16px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </main>
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={handleToastClose}
      />
    </div>
  );
}
