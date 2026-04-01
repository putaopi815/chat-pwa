import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact } from "@/types";

const DEFAULT_AVATAR_COLORS = ["#C8D4FF", "#FFD9C5", "#CFEED8", "#E8D5F2", "#D4E4FF", "#FFE5C8"];

/** 已知 userId 时拉通讯录（避免重复 getUser），用于客户端 Tab 等 */
export async function getMyContactsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Contact[]> {
  const { data: rows } = await supabase
    .from("user_contacts")
    .select("contact_user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!rows?.length) return [];

  const ids = rows.map((r) => r.contact_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, account_id, avatar_url")
    .in("id", ids);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const list = rows.map((r, i) => {
    const p = profileMap.get(r.contact_user_id);
    return {
      id: r.contact_user_id,
      nickname: p?.display_name?.trim() || "用户",
      accountId: p?.account_id ?? "",
      avatarColor: DEFAULT_AVATAR_COLORS[i % DEFAULT_AVATAR_COLORS.length],
      avatarUrl: p?.avatar_url?.trim() || null,
    };
  });

  list.sort((a, b) => (a.nickname || "").localeCompare(b.nickname || "", "zh-CN"));
  return list;
}

/** 获取当前用户通讯录（含 profile 信息），需已登录 */
export async function getMyContacts(supabase: SupabaseClient): Promise<Contact[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getMyContactsForUser(supabase, user.id);
}

/** 按 account_id 搜索用户（不含自己），用于添加好友 */
export async function searchProfilesByAccountId(
  supabase: SupabaseClient,
  accountId: string
): Promise<{ id: string; display_name: string | null; account_id: string; avatar_url: string | null } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !accountId.trim()) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, account_id, avatar_url")
    .ilike("account_id", accountId.trim())
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();

  return data;
}

/** 将某用户加入当前用户通讯录；若已是好友则无操作 */
export async function addContact(
  supabase: SupabaseClient,
  contactUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  if (contactUserId === user.id) return { ok: false, error: "不能添加自己" };

  const { error } = await supabase.from("user_contacts").insert({
    user_id: user.id,
    contact_user_id: contactUserId,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
