"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const FALLBACK = "用户";

/**
 * 统一拉取并订阅用户昵称，保证聊天列表、聊天详情、通讯录三处展示一致且实时更新。
 * @param userId 用户 ID，为 null 时返回兜底
 * @param initialDisplayName 服务端传入的初始昵称，用于首屏展示
 */
export function useProfileDisplayName(
  userId: string | null,
  initialDisplayName?: string | null
): string {
  const [displayName, setDisplayName] = useState<string>(() =>
    initialDisplayName?.trim() ? initialDisplayName.trim() : FALLBACK
  );
  const hasFetchedRef = useRef(false);

  // 无 userId 时仅随 prop 更新
  useEffect(() => {
    if (!userId) {
      setDisplayName(initialDisplayName?.trim() || FALLBACK);
    }
  }, [userId, initialDisplayName]);

  // 有 userId 时：客户端拉取最新昵称 + 订阅变更；避免被服务端缓存的「用户」覆盖
  useEffect(() => {
    if (!userId) return;
    hasFetchedRef.current = false;
    const supabase = createClient();

    const sync = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      const name = data?.display_name?.trim();
      hasFetchedRef.current = true;
      setDisplayName(name || FALLBACK);
    };
    sync();

    const channel = supabase
      .channel(`profile-display-name:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const r = payload.new as { display_name?: string | null };
          const name = r?.display_name?.trim();
          setDisplayName(name || FALLBACK);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 父组件 refresh 后传入的新昵称：仅当是真实昵称或尚未拉取成功时同步，避免用「用户」覆盖已拉取到的真实昵称
  useEffect(() => {
    if (!userId) return;
    const next = initialDisplayName?.trim() || FALLBACK;
    if (next !== FALLBACK || !hasFetchedRef.current) {
      setDisplayName(next);
      if (next !== FALLBACK) hasFetchedRef.current = true;
    }
  }, [userId, initialDisplayName]);

  return displayName || FALLBACK;
}
