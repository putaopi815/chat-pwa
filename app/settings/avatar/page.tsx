"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/client";

// 六张默认头像：放在 public/avatars/，命名为 avatar-1.png ~ avatar-6.png（可用 .jpg / .webp）
const DEFAULT_AVATAR_IDS = ["1", "2", "3", "4", "5", "6"] as const;
const PLACEHOLDER_AVATARS = DEFAULT_AVATAR_IDS.map((id) => ({
  id,
  src: `/avatars/avatar-${id}.png`,
}));

export default function AvatarSelectPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      const url = profile?.avatar_url;
      if (url) {
        const found = PLACEHOLDER_AVATARS.find((a) => a.src === url);
        if (found) setSelectedId(found.id);
      }
    })();
  }, []);

  const handleSelect = async (avatarId: string) => {
    const url = PLACEHOLDER_AVATARS.find((a) => a.id === avatarId)?.src ?? "";
    setSelectedId(avatarId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    router.refresh();
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <PageHeader title="选择头像" backHref="/settings" backLabel="返回" />
      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {PLACEHOLDER_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelect(avatar.id)}
              className={`aspect-square w-full overflow-hidden rounded-xl border-2 bg-muted transition-colors ${
                selectedId === avatar.id ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <img
                src={avatar.src}
                alt={`头像 ${avatar.id}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
